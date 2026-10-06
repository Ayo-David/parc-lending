import type { Server } from "node:http";
import {
  createApp,
  type LendingAccess,
  type LendingCommandHandlers,
} from "./app.js";

export function startServer(
  handlers: LendingCommandHandlers,
  access: LendingAccess,
  port = Number(process.env.PORT ?? 3005),
  readiness?: () => Promise<void>,
): Server {
  return createApp(handlers, access, readiness).listen(port);
}
