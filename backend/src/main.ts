import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import sensible from "@fastify/sensible";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { registerAdminRoutes } from "./modules/admin/routes.js";
import { registerAnalyticsRoutes } from "./modules/analytics/routes.js";
import { registerAuthRoutes } from "./modules/auth/routes.js";
import { registerAuditsRoutes } from "./modules/audits/routes.js";
import { registerBookingsRoutes } from "./modules/bookings/routes.js";
import { registerComponentsRoutes } from "./modules/components/routes.js";
import { registerCredentialsRoutes } from "./modules/credentials/routes.js";
import { registerDisputesRoutes } from "./modules/disputes/routes.js";
import { registerInvoicesRoutes } from "./modules/invoices/routes.js";
import { registerMintsRoutes } from "./modules/mints/routes.js";
import { registerNotificationsRoutes } from "./modules/notifications/routes.js";
import { registerPaymentsRoutes } from "./modules/payments/routes.js";
import { registerRecallsRoutes } from "./modules/recalls/routes.js";
import { registerServiceLogRoutes } from "./modules/service-logs/routes.js";
import { registerSolanaRoutes } from "./modules/solana/routes.js";
import { registerStorageRoutes } from "./modules/storage/routes.js";
import { registerTripsRoutes } from "./modules/trips/routes.js";
import { registerUsersRoutes } from "./modules/users/routes.js";
import { registerVehiclesRoutes } from "./modules/vehicles/routes.js";
import { registerWarrantiesRoutes } from "./modules/warranties/routes.js";
import { registerWebhooksRoutes } from "./modules/webhooks/routes.js";
import { registerWorkshopsRoutes } from "./modules/workshops/routes.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
await app.register(sensible);
await app.register(jwt, { secret: env.JWT_SECRET });

function serializeBigInt(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value && typeof value === "object" && typeof (value as { toJSON?: unknown }).toJSON === "function") {
    return (value as { toJSON: () => unknown }).toJSON();
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeBigInt(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializeBigInt(item)]));
  }
  return value;
}

app.addHook("preSerialization", async (_request, _reply, payload) => serializeBigInt(payload));

app.get("/health", async () => ({
  ok: true,
  service: "noc-id-backend",
  cluster: env.SOLANA_CLUSTER,
  idrxMint: env.IDRX_MINT
}));

await app.register(registerAuthRoutes, { prefix: "/auth" });
await app.register(registerUsersRoutes, { prefix: "/users" });
await app.register(registerVehiclesRoutes, { prefix: "/vehicles" });
await app.register(registerWorkshopsRoutes, { prefix: "/workshops" });
await app.register(registerCredentialsRoutes, { prefix: "/credentials" });
await app.register(registerBookingsRoutes, { prefix: "/bookings" });
await app.register(registerInvoicesRoutes, { prefix: "/invoices" });
await app.register(registerPaymentsRoutes, { prefix: "/payments" });
await app.register(registerServiceLogRoutes, { prefix: "/service-logs" });
await app.register(registerComponentsRoutes, { prefix: "/components" });
await app.register(registerMintsRoutes, { prefix: "/mints" });
await app.register(registerAuditsRoutes, { prefix: "/audits" });
await app.register(registerWarrantiesRoutes, { prefix: "/warranties" });
await app.register(registerDisputesRoutes, { prefix: "/disputes" });
await app.register(registerRecallsRoutes, { prefix: "/recalls" });
await app.register(registerNotificationsRoutes, { prefix: "/notifications" });
await app.register(registerAnalyticsRoutes, { prefix: "/analytics" });
await app.register(registerAdminRoutes, { prefix: "/admin" });
await app.register(registerSolanaRoutes, { prefix: "/solana" });
await app.register(registerStorageRoutes, { prefix: "/storage" });
await app.register(registerTripsRoutes, { prefix: "/trips" });
await app.register(registerWebhooksRoutes, { prefix: "/webhooks" });

await app.listen({ port: env.PORT, host: "0.0.0.0" });
