import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ReturnsRepository } from "../repositories/returns-repository.js";
import { hasPermission } from "../security/request-context.js";
const schema=z.object({invoiceId:z.string().uuid(),locationId:z.string().uuid(),reason:z.string().trim().min(2).max(500),refundMethod:z.enum(["cash","bank","mobile_money","credit_note"]).optional(),items:z.array(z.object({variantId:z.string().uuid(),quantity:z.string().regex(/^\d+(\.\d{1,6})?$/),disposition:z.enum(["sellable","damaged","quarantined","non_sellable"]),unitRefund:z.string().regex(/^\d+(\.\d{1,4})?$/)})).min(1)});
export function registerReturnsRoutes(app:FastifyInstance,repository:ReturnsRepository):void{
 const guard=(r:any,reply:any,permission:string)=>{const c=r.requestContext;if(!c)return reply.code(401).send({status:"unauthenticated"});if(!hasPermission(c,permission as never))return reply.code(403).send({status:"forbidden"});return c;};
 app.post<{Body:unknown}>("/v1/sales/returns",async(r,reply)=>{const c=guard(r,reply,"sales.create");if(!c)return;const p=schema.safeParse(r.body);if(!p.success)return reply.code(400).send({status:"invalid_request",issues:p.error.flatten()});return reply.code(201).send({data:await repository.create(c,p.data)});});
 app.post<{Params:{returnId:string}}>("/v1/sales/returns/:returnId/approve",async(r,reply)=>{const c=guard(r,reply,"sales.post");if(!c)return;return{data:await repository.approve(c,r.params.returnId)};});
 app.post<{Params:{returnId:string}}>("/v1/sales/returns/:returnId/complete",async(r,reply)=>{const c=guard(r,reply,"sales.post");if(!c)return;return{data:await repository.complete(c,r.params.returnId)};});
}
