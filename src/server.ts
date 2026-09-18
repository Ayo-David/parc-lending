import type { Server } from "node:http";
import {
  createApp,
  type LendingAuthenticator,
  type LendingCommandHandlers,
} from "./app.js";

export function startServer(
  handlers: LendingCommandHandlers,
  authenticator: LendingAuthenticator,
  port = Number(process.env.PORT ?? 3005),
  readiness?: () => Promise<void>,
): Server {
  return createApp(handlers, authenticator, readiness).listen(port);
}
