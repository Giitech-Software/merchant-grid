import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { PublicCatalogueRepository } from "../repositories/public-catalogue-repository.js";
import { hasPermission } from "../security/request-context.js";
const schema=z.object({variantId:z.string().uuid(),publicName:z.string().trim().min(2).max(200),publicDescription:z.string().max(2000).optional(),publicCategory:z.string().max(120).optional(),publicPrice:z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),stockDisplayMode:z.enum(["exact","available","hidden"]),publishedStock:z.string().regex(/^\d+(\.\d{1,6})?$/).optional(),isFeatured:z.boolean().optional()});
const query=z.object({search:z.string().max(100).optional(),category:z.string().max(120).optional(),featured:z.coerce.boolean().optional(),limit:z.coerce.number().int().min(1).max(100).default(24),offset:z.coerce.number().int().min(0).default(0)});
export function registerPublicCatalogueRoutes(app:FastifyInstance,repository:PublicCatalogueRepository):void{
 app.get<{Params:{businessId:string};Querystring:Record<string,unknown> }>("/public/catalogue/:businessId/products",async(r,reply)=>{const p=query.safeParse(r.query);if(!p.success)return reply.code(400).send({status:"invalid_request",issues:p.error.flatten()});return{data:await repository.listPublished(r.params.businessId,p.data)};});
 app.post<{Body:unknown}>("/v1/public-catalogue/publish",async(r,reply)=>{const c=r.requestContext;if(!c)return reply.code(401).send({status:"unauthenticated"});if(!hasPermission(c,"catalogue.publish" as never))return reply.code(403).send({status:"forbidden"});const p=schema.safeParse(r.body);if(!p.success)return reply.code(400).send({status:"invalid_request",issues:p.error.flatten()});return{data:await repository.publish(c,p.data)};});
 app.post<{Params:{variantId:string}}>("/v1/public-catalogue/:variantId/unpublish",async(r,reply)=>{const c=r.requestContext;if(!c)return reply.code(401).send({status:"unauthenticated"});if(!hasPermission(c,"catalogue.publish" as never))return reply.code(403).send({status:"forbidden"});await repository.unpublish(c,r.params.variantId);return{status:"ok"};});
}
