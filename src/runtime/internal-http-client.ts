import type { LendingApprovalGateway } from "../services/approval-gateway.js";
import type { RepaymentAuthorizationVerifier } from "../services/customer-lending-service.js";
import type { TransactionAuthorizationVerifier } from "../services/loan-offer-service.js";

interface HttpClientConfig {
  authCustomerUrl: string;
  tenantAdminUrl: string;
  serviceToken: string;
  timeoutMs?: number;
}

export class InternalHttpClient
  implements
    LendingApprovalGateway,
    TransactionAuthorizationVerifier,
    RepaymentAuthorizationVerifier
{
  private readonly timeoutMs: number;

  public constructor(private readonly config: HttpClientConfig) {
    this.timeoutMs = config.timeoutMs ?? 5_000;
  }

  public async consume(
    input: Parameters<LendingApprovalGateway["consume"]>[0],
  ): ReturnType<LendingApprovalGateway["consume"]> {
    const response = await this.request<Record<string, unknown>>(
      `${this.config.tenantAdminUrl}/internal/v1/approvals/${input.approvalId}/consume`,
      {
        headers: {
          "x-service-token": this.config.serviceToken,
          "x-service-name": "parc-lending",
          "x-tenant-id": input.tenantId,
          "idempotency-key": input.idempotencyKey,
          "x-correlation-id": input.correlationId,
        },
        body: {
          action: input.action,
          resource_type: input.resourceType,
          resource_id: input.resourceId,
          payload_hash: input.payloadHash,
        },
      },
    );
    return {
      approvalId: string(response, "id"),
      replayed: response.replayed === true,
      ...(typeof response.maker_id === "string"
        ? { makerId: response.maker_id }
        : {}),
      ...(Array.isArray(response.checker_ids)
        ? { checkerIds: response.checker_ids.map(String) }
        : {}),
      ...(typeof response.approved_authority_level === "number"
        ? { authorityLevel: response.approved_authority_level }
        : {}),
      ...(typeof response.consumed_at === "string"
        ? { consumedAt: response.consumed_at }
        : {}),
    };
  }

  public async verify(input: {
    tenantId: string;
    customerId: string;
    action: "ACCEPT_LOAN_OFFER" | "CREATE_LOAN_REPAYMENT";
    resourceId: string;
    token: string;
  }): Promise<{ reference: string; customerId: string; subject: string }> {
    const response = await this.request<Record<string, unknown>>(
      `${this.config.authCustomerUrl}/internal/v1/transaction-authorizations/consume`,
      {
        headers: {
          authorization: `Bearer ${this.config.serviceToken}`,
          "x-service-name": "parc-lending",
          "x-tenant-id": input.tenantId,
          "idempotency-key": `${input.action}:${input.resourceId}`,
        },
        body: {
          authorization_token: input.token,
          customer_id: input.customerId,
          command_type: input.action,
          resource_id: input.resourceId,
        },
      },
    );
    return {
      reference: string(response, "authorization_reference"),
      customerId: string(response, "customer_id"),
      subject: string(response, "subject"),
    };
  }

  public getLendingEligibility(input: {
    tenantId: string;
    customerId: string;
    consentReference: string;
  }): Promise<Record<string, unknown>> {
    const query = new URLSearchParams({
      consent_reference: input.consentReference,
    });
    return this.request<Record<string, unknown>>(
      `${this.config.authCustomerUrl}/internal/v1/tenants/${input.tenantId}/customers/${input.customerId}/lending-eligibility?${query.toString()}`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${this.config.serviceToken}`,
          "x-service-name": "parc-lending",
          "x-tenant-id": input.tenantId,
        },
      },
    );
  }

  private async request<T>(
    url: string,
    input: {
      headers: Record<string, string>;
      body?: object;
      method?: "GET" | "POST";
    },
  ): Promise<T> {
    const response = await fetch(url, {
      method: input.method ?? "POST",
      headers: { "content-type": "application/json", ...input.headers },
      ...(input.body ? { body: JSON.stringify(input.body) } : {}),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    const body: unknown = await response.json();
    if (!response.ok)
      throw new Error(`Internal request failed (${response.status})`);
    return body as T;
  }
}

function string(value: Record<string, unknown>, key: string): string {
  const result = value[key];
  if (typeof result !== "string")
    throw new Error(`Internal response is missing ${key}`);
  return result;
}
