import type { RequestHandler } from "express";
import type { LendingAccess } from "../../src/app.js";
import {
  authorize,
  type AccessPolicy,
  type ParcPrincipal,
} from "../../src/security/parc-service-auth.js";

/**
 * For HTTP tests that exercise domain behaviour: grants each route the
 * principal its policy expects and still runs the real policy check.
 */
export function testAccess(identity: {
  tenantId: string;
  subjectId: string;
}): LendingAccess {
  return {
    require(policy: AccessPolicy): RequestHandler {
      return (request, _response, next) => {
        const delegatedAs = policy.subjectTypes?.[0];
        const actor = policy.actors?.[0] ?? "parc-test";
        const base = {
          tenantId: identity.tenantId,
          scopes: new Set(policy.scopes),
          token: "test",
          expiresAt: Math.floor(Date.now() / 1000) + 300,
        };
        const principal: ParcPrincipal = delegatedAs
          ? {
              ...base,
              kind: "delegated",
              client: actor,
              actors: [actor],
              subject: {
                id: identity.subjectId,
                type: delegatedAs,
                sessionId: "00000000-0000-4000-8000-000000000000",
              },
            }
          : { ...base, kind: "service", client: actor, actors: [] };
        authorize(principal, policy);
        request.parcPrincipal = principal;
        next();
      };
    },
  };
}
