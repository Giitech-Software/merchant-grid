import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerAuthenticationHook } from "./auth/auth-hook.js";
import type { SessionVerifier } from "./auth/session-context.js";
import type { BusinessRepository } from "./repositories/business-repository.js";
import { registerBusinessRoutes } from "./routes/business-routes.js";
import type { MembershipRepository } from "./repositories/membership-repository.js";
import { registerMembershipRoutes } from "./routes/membership-routes.js";
import type { RoleRepository } from "./repositories/role-repository.js";
import { registerRoleRoutes } from "./routes/role-routes.js";
import type { UserRepository } from "./repositories/user-repository.js";
import { registerUserRoutes } from "./routes/user-routes.js";
import type { LocationRepository } from "./repositories/location-repository.js";
import { registerLocationRoutes } from "./routes/location-routes.js";
import type { AuditRepository } from "./repositories/audit-repository.js";
import { registerAuditRoutes } from "./routes/audit-routes.js";
import type { CatalogueRepository } from "./repositories/catalogue-repository.js";
import { registerCatalogueRoutes } from "./routes/catalogue-routes.js";
import type { UnitRepository } from "./repositories/unit-repository.js";
import { registerUnitRoutes } from "./routes/unit-routes.js";
import type { InventoryRepository } from "./repositories/inventory-repository.js";
import { registerInventoryRoutes } from "./routes/inventory-routes.js";
import type { StockCountRepository } from "./repositories/stock-count-repository.js";
import { registerStockCountRoutes } from "./routes/stock-count-routes.js";
import type { SalesRepository } from "./repositories/sales-repository.js";
import { registerSalesRoutes } from "./routes/sales-routes.js";
import type { ReturnsRepository } from "./repositories/returns-repository.js";
import { registerReturnsRoutes } from "./routes/returns-routes.js";
import type { AccountingRepository } from "./repositories/accounting-repository.js";
import { registerAccountingRoutes } from "./routes/accounting-routes.js";
import type { AccountRepository } from "./repositories/account-repository.js";
import { registerAccountRoutes } from "./routes/account-routes.js";
import type { AccountMappingRepository } from "./repositories/account-mapping-repository.js";
import { registerAccountMappingRoutes } from "./routes/account-mapping-routes.js";
import type { PurchasingRepository } from "./repositories/purchasing-repository.js";
import { registerPurchasingRoutes } from "./routes/purchasing-routes.js";
import { registerSupplierPayableRoutes } from "./routes/supplier-payable-routes.js";
import type { ExpenseRepository } from "./repositories/expense-repository.js";
import { registerExpenseRoutes } from "./routes/expense-routes.js";
import type { EnquiryRepository } from "./repositories/enquiry-repository.js";
import { registerEnquiryRoutes } from "./routes/enquiry-routes.js";
import type { ReportRepository } from "./repositories/report-repository.js";
import { registerReportRoutes } from "./routes/report-routes.js";
import type { PublicCatalogueRepository } from "./repositories/public-catalogue-repository.js";
import { registerPublicCatalogueRoutes } from "./routes/public-catalogue-routes.js";
import { hasPermission, type RequestContext } from "./security/request-context.js";

export function buildApp(
  verifier?: SessionVerifier,
  businessRepository?: BusinessRepository,
  membershipRepository?: MembershipRepository,
  roleRepository?: RoleRepository,
  userRepository?: UserRepository,
  locationRepository?: LocationRepository,
  auditRepository?: AuditRepository,
  catalogueRepository?: CatalogueRepository,
  unitRepository?: UnitRepository,
  inventoryRepository?: InventoryRepository,
  stockCountRepository?: StockCountRepository,
  salesRepository?: SalesRepository,
  returnsRepository?: ReturnsRepository,
  accountingRepository?: AccountingRepository,
  accountRepository?: AccountRepository,
  accountMappingRepository?: AccountMappingRepository,
  purchasingRepository?: PurchasingRepository,
  expenseRepository?: ExpenseRepository,
  enquiryRepository?: EnquiryRepository,
  reportRepository?: ReportRepository,
  publicCatalogueRepository?: PublicCatalogueRepository,
) {
  const app = Fastify({ logger: true });
  void app.register(cors, { origin: true });

  if (verifier) registerAuthenticationHook(app, verifier);
  if (businessRepository) registerBusinessRoutes(app, businessRepository);
  if (membershipRepository) registerMembershipRoutes(app, membershipRepository);
  if (roleRepository) registerRoleRoutes(app, roleRepository);
  if (userRepository) registerUserRoutes(app, userRepository);
  if (locationRepository) registerLocationRoutes(app, locationRepository);
  if (auditRepository) registerAuditRoutes(app, auditRepository);
  if (catalogueRepository) registerCatalogueRoutes(app, catalogueRepository);
  if (unitRepository) registerUnitRoutes(app, unitRepository);
  if (inventoryRepository) registerInventoryRoutes(app, inventoryRepository);
  if (stockCountRepository) registerStockCountRoutes(app, stockCountRepository);
  if (salesRepository) registerSalesRoutes(app, salesRepository);
  if (returnsRepository) registerReturnsRoutes(app, returnsRepository);
  if (accountingRepository) registerAccountingRoutes(app, accountingRepository);
  if (accountRepository) registerAccountRoutes(app, accountRepository);
  if (accountMappingRepository) registerAccountMappingRoutes(app, accountMappingRepository);
  if (purchasingRepository) registerPurchasingRoutes(app, purchasingRepository);
  if (purchasingRepository) registerSupplierPayableRoutes(app, purchasingRepository);
  if (expenseRepository) registerExpenseRoutes(app, expenseRepository);
  if (enquiryRepository) registerEnquiryRoutes(app, enquiryRepository);
  if (reportRepository) registerReportRoutes(app, reportRepository);
  if (publicCatalogueRepository) registerPublicCatalogueRoutes(app, publicCatalogueRepository);

  app.get("/health", async () => ({ status: "ok", service: "core-api" }));

  app.get<{ Reply: { status: string; tenantId: string } }>("/v1/context", async (request, reply) => {
    // Authentication middleware will populate this context from a verified session.
    // It must never be accepted from an arbitrary client header or request body.
    const context = request.requestContext as RequestContext | undefined;
    if (!context || !hasPermission(context, "business.view")) {
      return reply.code(403).send({ status: "forbidden", tenantId: "" });
    }

    return { status: "authorized", tenantId: context.tenantId };
  });

  return app;
}

declare module "fastify" {
  interface FastifyRequest {
    requestContext?: RequestContext;
  }
}
