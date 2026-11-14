import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { CatalogueRepository } from "../repositories/catalogue-repository.js";
import { hasPermission } from "../security/request-context.js";
const categorySchema = z.object({ name: z.string().trim().min(2).max(120), slug: z.string().regex(/^[a-z0-9-]+$/) });
const productSchema = z.object({ categoryId: z.string().uuid().optional(), sku: z.string().trim().min(1).max(80), name: z.string().trim().min(2).max(200), description: z.string().max(2000).optional(), brand: z.string().max(120).optional() });
const variantSchema = z.object({ productId: z.string().uuid(), sku: z.string().trim().min(1).max(80), name: z.string().trim().min(1).max(150), retailPrice: z.string().regex(/^\d+(\.\d{1,4})?$/), wholesalePrice: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(), buyingCost: z.string().regex(/^\d+(\.\d{1,4})?$/).optional() });
const barcodeSchema = z.object({ variantId: z.string().uuid(), barcode: z.string().trim().min(3).max(100), isPrimary: z.boolean().optional() });
export function registerCatalogueRoutes(app: FastifyInstance, repository: CatalogueRepository): void {
  app.get<{ Params: { productId: string } }>("/v1/catalogue/products/:productId/variants", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "product.view")) return reply.code(403).send({ status: "forbidden" });
    return { data: await repository.listVariants(context, request.params.productId) };
  });
  app.post<{ Body: unknown }>("/v1/catalogue/variants", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "product.create")) return reply.code(403).send({ status: "forbidden" });
    const parsed = variantSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ status: "invalid_request", issues: parsed.error.flatten() });
    return reply.code(201).send({ data: await repository.createVariant(context, parsed.data) });
  });
  app.post<{ Body: unknown }>("/v1/catalogue/barcodes", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "product.create")) return reply.code(403).send({ status: "forbidden" });
    const parsed = barcodeSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ status: "invalid_request", issues: parsed.error.flatten() });
    return reply.code(201).send({ data: await repository.createBarcode(context, parsed.data) });
  });
  app.get("/v1/catalogue/categories", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "product.view")) return reply.code(403).send({ status: "forbidden" });
    return { data: await repository.listCategories(context) };
  });
  app.post<{ Body: unknown }>("/v1/catalogue/categories", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "product.create")) return reply.code(403).send({ status: "forbidden" });
    const parsed = categorySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ status: "invalid_request", issues: parsed.error.flatten() });
    return reply.code(201).send({ data: await repository.createCategory(context, parsed.data) });
  });
  app.get("/v1/catalogue/products", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "product.view")) return reply.code(403).send({ status: "forbidden" });
    return { data: await repository.listProducts(context) };
  });
  app.post<{ Body: unknown }>("/v1/catalogue/products", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "product.create")) return reply.code(403).send({ status: "forbidden" });
    const parsed = productSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ status: "invalid_request", issues: parsed.error.flatten() });
    return reply.code(201).send({ data: await repository.createProduct(context, parsed.data) });
  });
}
