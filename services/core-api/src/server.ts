import { buildApp } from "./app.js";
import { createDatabasePool } from "./db/pool.js";
import { PostgresBusinessRepository } from "./repositories/postgres-business-repository.js";
import { FirebaseTokenIntrospector } from "./auth/firebase-token-introspector.js";
import { BearerTokenSessionVerifier } from "./auth/session-context.js";
import { PostgresMembershipResolver } from "./auth/postgres-membership-resolver.js";
import { PostgresMembershipRepository } from "./repositories/postgres-membership-repository.js";
import { PostgresRoleRepository } from "./repositories/postgres-role-repository.js";
import { PostgresUserRepository } from "./repositories/postgres-user-repository.js";
import { PostgresLocationRepository } from "./repositories/postgres-location-repository.js";
import { PostgresAuditRepository } from "./repositories/postgres-audit-repository.js";
import { PostgresCatalogueRepository } from "./repositories/postgres-catalogue-repository.js";
import { PostgresUnitRepository } from "./repositories/postgres-unit-repository.js";
import { PostgresInventoryRepository } from "./repositories/postgres-inventory-repository.js";
import { PostgresStockCountRepository } from "./repositories/postgres-stock-count-repository.js";
import { PostgresSalesRepository } from "./repositories/postgres-sales-repository.js";
import { PostgresReturnsRepository } from "./repositories/postgres-returns-repository.js";
import { PostgresAccountingRepository } from "./repositories/postgres-accounting-repository.js";
import { PostgresAccountRepository } from "./repositories/postgres-account-repository.js";
import { PostgresAccountMappingRepository } from "./repositories/postgres-account-mapping-repository.js";
import { PostgresPurchasingRepository } from "./repositories/postgres-purchasing-repository.js";
import { PostgresExpenseRepository } from "./repositories/postgres-expense-repository.js";
import { PostgresEnquiryRepository } from "./repositories/postgres-enquiry-repository.js";
import { PostgresReportRepository } from "./repositories/postgres-report-repository.js";
import { PostgresPublicCatalogueRepository } from "./repositories/postgres-public-catalogue-repository.js";

const pool = createDatabasePool();
const repository = new PostgresBusinessRepository(pool);
const membershipRepository = new PostgresMembershipRepository(pool);
const roleRepository = new PostgresRoleRepository(pool);
const userRepository = new PostgresUserRepository(pool);
const locationRepository = new PostgresLocationRepository(pool);
const auditRepository = new PostgresAuditRepository(pool);
const catalogueRepository = new PostgresCatalogueRepository(pool);
const unitRepository = new PostgresUnitRepository(pool);
const inventoryRepository = new PostgresInventoryRepository(pool);
const stockCountRepository = new PostgresStockCountRepository(pool);
const salesRepository = new PostgresSalesRepository(pool);
const returnsRepository = new PostgresReturnsRepository(pool);
const accountingRepository = new PostgresAccountingRepository(pool);
const accountRepository = new PostgresAccountRepository(pool);
const accountMappingRepository = new PostgresAccountMappingRepository(pool);
const purchasingRepository = new PostgresPurchasingRepository(pool);
const expenseRepository = new PostgresExpenseRepository(pool);
const enquiryRepository = new PostgresEnquiryRepository(pool);
const reportRepository = new PostgresReportRepository(pool);
const publicCatalogueRepository = new PostgresPublicCatalogueRepository(pool);
const memberships = new PostgresMembershipResolver(pool);
const hasFirebaseConfig = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY,
);
const verifier = hasFirebaseConfig
  ? new BearerTokenSessionVerifier(new FirebaseTokenIntrospector(), memberships)
  : undefined;
const app = buildApp(verifier, repository, membershipRepository, roleRepository, userRepository, locationRepository, auditRepository, catalogueRepository, unitRepository, inventoryRepository, stockCountRepository, salesRepository, returnsRepository, accountingRepository, accountRepository, accountMappingRepository, purchasingRepository, expenseRepository, enquiryRepository, reportRepository, publicCatalogueRepository);
app.get("/health/ready", async (_request, reply) => {
  try {
    await pool.query("select 1");
    return { status: "ready", database: "ok" };
  } catch {
    return reply.code(503).send({ status: "not_ready", database: "unavailable" });
  }
});
const port = Number(process.env.PORT ?? 3000);

try {
  if (!verifier) app.log.warn("Firebase credentials are not configured; protected routes will reject requests");
  await app.listen({ host: "0.0.0.0", port });
} catch (error) {
  app.log.error(error);
  await pool.end();
  process.exit(1);
}

const shutdown = async (signal: string) => {
  app.log.info({ signal }, "shutting down");
  await app.close();
  await pool.end();
  process.exit(0);
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
