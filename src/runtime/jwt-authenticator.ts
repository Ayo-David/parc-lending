import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { LendingAuthenticator } from "../app.js";

export class JwksLendingAuthenticator implements LendingAuthenticator {
  private readonly keys: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    jwksUrl: string,
    private readonly issuer: string,
    private readonly audiences: Record<
      "CUSTOMER" | "ADMIN" | "SERVICE",
      string
    >,
  ) {
    this.keys = createRemoteJWKSet(new URL(jwksUrl), {
      cooldownDuration: 30_000,
      timeoutDuration: 5_000,
    });
  }

  async authenticate(input: {
    authorization: string;
    audience: "CUSTOMER" | "ADMIN" | "SERVICE";
  }): Promise<{ tenantId: string; subjectId: string }> {
    const token = input.authorization.slice("Bearer ".length);
    const { payload } = await jwtVerify(token, this.keys, {
      issuer: this.issuer,
      audience: this.audiences[input.audience],
      algorithms: ["RS256", "ES256", "EdDSA"],
      clockTolerance: 5,
    });
    return principal(payload);
  }
}

function principal(payload: JWTPayload): {
  tenantId: string;
  subjectId: string;
} {
  const tenantId = payload.tenant_id;
  if (typeof payload.sub !== "string" || typeof tenantId !== "string")
    throw new Error("JWT is missing subject or tenant claims");
  if (typeof payload.session_id !== "string")
    throw new Error("JWT is missing the required session claim");
  return { tenantId, subjectId: payload.sub };
}
