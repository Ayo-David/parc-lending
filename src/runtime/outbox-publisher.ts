import { randomUUID } from "node:crypto";
import amqp, { type ConfirmChannel, type ChannelModel } from "amqplib";
import type { Knex } from "knex";
import { withTenantTransaction } from "../database/client.js";

interface OutboxRow {
  id: string;
  tenant_id: string;
  aggregate_type: string;
  aggregate_id: string;
  aggregate_version: number;
  event_type: string;
  event_version: number;
  payload: Record<string, unknown>;
  idempotency_key: string;
  correlation_id: string;
  causation_id: string | null;
  data_classification: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
  created_at: Date;
}

export class LendingOutboxPublisher {
  private connection: ChannelModel | undefined;
  private channel: ConfirmChannel | undefined;
  private readonly workerId = `parc-lending:${randomUUID()}`;
  private connecting: Promise<void> | undefined;
  private reconnectDelayMs = 0;
  private reconnectAt = 0;
  private closing = false;

  constructor(
    private readonly db: Knex,
    private readonly rabbitUrl: string,
    private readonly exchange = "parc.events",
  ) {}

  async connect(): Promise<void> {
    const connection = await amqp.connect(this.rabbitUrl);
    // Drop the broken channel so the next batch reconnects instead of publishing into it.
    const reset = () => {
      if (this.connection === connection) {
        this.connection = undefined;
        this.channel = undefined;
      }
    };
    connection.on("error", reset);
    connection.on("close", reset);
    try {
      const channel = await connection.createConfirmChannel();
      const resetChannel = () => {
        if (this.channel === channel) this.channel = undefined;
      };
      channel.on("error", resetChannel);
      channel.on("close", resetChannel);
      await channel.assertExchange(this.exchange, "topic", {
        durable: true,
      });
      this.connection = connection;
      this.channel = channel;
    } catch (error) {
      await connection.close().catch(() => undefined);
      throw error;
    }
  }

  async publishTenantBatch(tenantId: string, limit = 50): Promise<number> {
    if (!this.channel) await this.reconnect();
    const rows = await this.claim(tenantId, limit);
    for (const row of rows) await this.publish(row);
    return rows.length;
  }

  async close(): Promise<void> {
    this.closing = true;
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  /** One shared reconnect attempt, with exponential backoff after failures. */
  private reconnect(): Promise<void> {
    if (this.closing)
      return Promise.reject(new Error("RabbitMQ publisher is closed"));
    if (Date.now() < this.reconnectAt)
      return Promise.reject(new Error("RabbitMQ publisher is reconnecting"));
    this.connecting ??= this.connect()
      .then(() => {
        this.reconnectDelayMs = 0;
        this.reconnectAt = 0;
      })
      .catch((error: unknown) => {
        this.reconnectDelayMs = Math.min(
          30_000,
          Math.max(1_000, this.reconnectDelayMs * 2),
        );
        this.reconnectAt = Date.now() + this.reconnectDelayMs;
        throw error;
      })
      .finally(() => {
        this.connecting = undefined;
      });
    return this.connecting;
  }

  private claim(tenantId: string, limit: number): Promise<OutboxRow[]> {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      await tx("loan_outbox_events")
        .where({ tenant_id: tenantId, status: "PROCESSING" })
        .where("lease_expires_at", "<=", tx.fn.now())
        .update({
          status: "PENDING",
          lease_owner: null,
          lease_expires_at: null,
        });
      const candidates = await tx("loan_outbox_events")
        .where({ tenant_id: tenantId })
        .whereIn("status", ["PENDING", "FAILED"])
        .where("available_at", "<=", tx.fn.now())
        .orderBy("created_at")
        .forUpdate()
        .skipLocked()
        .limit(limit)
        .select<OutboxRow[]>("*");
      if (candidates.length === 0) return [];
      const ids = candidates.map((row) => row.id);
      await tx("loan_outbox_events")
        .whereIn("id", ids)
        .update({
          status: "PROCESSING",
          lease_owner: this.workerId,
          lease_expires_at: tx.raw("now() + interval '60 seconds'"),
        });
      return candidates;
    });
  }

  private async publish(row: OutboxRow): Promise<void> {
    if (!this.channel) throw new Error("RabbitMQ publisher is not connected");
    const envelope = {
      event_id: row.id,
      event_type: row.event_type,
      event_version: row.event_version,
      occurred_at: row.created_at.toISOString(),
      producer: "parc-lending",
      tenant_id: row.tenant_id,
      aggregate_type: row.aggregate_type,
      aggregate_id: row.aggregate_id,
      aggregate_version: row.aggregate_version,
      correlation_id: row.correlation_id,
      causation_id: row.causation_id,
      idempotency_key: row.idempotency_key,
      data_classification: row.data_classification,
      payload: row.payload,
    };
    try {
      this.channel.publish(
        this.exchange,
        row.event_type,
        Buffer.from(JSON.stringify(envelope)),
        {
          persistent: true,
          contentType: "application/json",
          messageId: row.id,
          correlationId: row.correlation_id,
          type: row.event_type,
          timestamp: Math.floor(row.created_at.getTime() / 1000),
        },
      );
      await this.channel.waitForConfirms();
      await withTenantTransaction(this.db, row.tenant_id, (tx) =>
        tx("loan_outbox_events")
          .where({
            id: row.id,
            status: "PROCESSING",
            lease_owner: this.workerId,
          })
          .update({
            status: "PUBLISHED",
            published_at: tx.fn.now(),
            lease_owner: null,
            lease_expires_at: null,
            last_error: null,
          }),
      );
    } catch (error) {
      await withTenantTransaction(this.db, row.tenant_id, (tx) =>
        tx("loan_outbox_events")
          .where({
            id: row.id,
            status: "PROCESSING",
            lease_owner: this.workerId,
          })
          .update({
            status: "FAILED",
            retry_count: tx.raw("retry_count+1"),
            available_at: tx.raw(
              "now() + least(interval '5 minutes', interval '1 second' * power(2,retry_count))",
            ),
            lease_owner: null,
            lease_expires_at: null,
            last_error:
              error instanceof Error
                ? error.message.slice(0, 1000)
                : "Publish failed",
          }),
      );
      throw error;
    }
  }
}
