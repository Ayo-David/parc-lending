import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { once } from "node:events";
import { jest } from "@jest/globals";
import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWTPayload,
} from "jose";
import { createApp, type LendingCommandHandlers } from "../../src/app.js";
import { createParcAuth } from "../../src/security/parc-service-auth.js";

const issuer = "https://auth.parc.invalid";
const tenantId = "11111111-1111-4111-8111-111111111111";
const customerId = "22222222-2222-4222-8222-222222222222";
const sessionId = "33333333-3333-4333-8333-333333333333";

test("authorizes the user and acting service from Auth-issued tokens", async () => {
  const keys = await generateKeyPair("RS256");
  const jwks = createLocalJWKSet({
    keys: [{ ...(await exportJWK(keys.publicKey)), kid: "k1", alg: "RS256" }],
  });
  const sign = (claims: JWTPayload) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: "RS256", kid: "k1" })
      .setIssuer(issuer)
      .setAudience("parc-lending")
      .setJti(randomUUID())
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(keys.privateKey);
  const delegated = (
    client: string,
    scope: string,
    type: "CUSTOMER" | "ADMINISTRATOR",
  ) =>
    sign({
      sub: customerId,
      client_id: client,
      token_use: "delegated",
      tenant_id: tenantId,
      scope,
      subject_type: type,
      subject_scope: "TENANT",
      session_id: sessionId,
      act: { sub: client },
    });
  const listCustomerLoans = jest.fn(() => Promise.resolve([]));
  const handlers = new Proxy({} as LendingCommandHandlers, {
    get: (_target, name) =>
      name === "listCustomerLoans"
        ? listCustomerLoans
        : () => Promise.resolve({}),
  });
  const server = createApp(
    handlers,
    createParcAuth({ issuer, audience: "parc-lending", keys: jwks }),
  ).listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const port = (server.address() as AddressInfo).port;
    const loans = async (token: string) =>
      (
        await fetch(`http://127.0.0.1:${port}/v1/customer/loans`, {
          headers: {
            authorization: `Bearer ${token}`,
            "x-tenant-id": tenantId,
          },
        })
      ).status;
    expect(
      await loans(
        await delegated("parc-mobile-bff", "lending.customer.read", "CUSTOMER"),
      ),
    ).toBe(200);
    expect(listCustomerLoans).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId, customerId }),
    );
    expect(
      await loans(
        await delegated("parc-admin-bff", "lending.customer.read", "CUSTOMER"),
      ),
    ).toBe(403);
    expect(
      await loans(
        await delegated(
          "parc-mobile-bff",
          "lending.customer.read",
          "ADMINISTRATOR",
        ),
      ),
    ).toBe(403);
    expect(
      await loans(
        await sign({
          sub: "parc-payment",
          client_id: "parc-payment",
          token_use: "service",
          tenant_id: tenantId,
          scope: "lending.customer.read",
        }),
      ),
    ).toBe(403);
    expect(
      (await fetch(`http://127.0.0.1:${port}/v1/customer/loans`)).status,
    ).toBe(401);
  } finally {
    server.close();
  }
});
