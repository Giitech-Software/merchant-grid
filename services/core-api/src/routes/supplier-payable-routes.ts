import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { PurchasingRepository } from "../repositories/purchasing-repository.js";
import { hasPermission } from "../security/request-context.js";
const invoice=z.object({supplierId:z.string().uuid(),goodsReceivedId:z.string().uuid().optional(),invoiceNumber:z.string().trim().min(1).max(100),total:z.string().regex(/^\d+(\.\d{1,4})?$/)});
const payment=z.object({supplierInvoiceId:z.string().uuid(),amount:z.string().regex(/^\d+(\.\d{1,4})?$/),method:z.enum(["cash","bank","mobile_money"]),reference:z.string().max(200).optional()});
export function registerSupplierPayableRoutes(app:FastifyInstance,repository:PurchasingRepository):void{
  app.post<{Body:unknown}>("/v1/purchasing/supplier-invoices",async(r,reply)=>{const c=r.requestContext;if(!c)return reply.code(401).send({status:"unauthenticated"});if(!hasPermission(c,"purchasing.create" as never))return reply.code(403).send({status:"forbidden"});if(!repository.createSupplierInvoice)return reply.code(501).send({status:"not_implemented"});const p=invoice.safeParse(r.body);if(!p.success)return reply.code(400).send({status:"invalid_request",issues:p.error.flatten()});return reply.code(201).send({data:await repository.createSupplierInvoice(c,p.data)});});
  app.post<{Body:unknown}>("/v1/purchasing/supplier-payments",async(r,reply)=>{const c=r.requestContext;if(!c)return reply.code(401).send({status:"unauthenticated"});if(!hasPermission(c,"purchasing.create" as never))return reply.code(403).send({status:"forbidden"});if(!repository.paySupplierInvoice)return reply.code(501).send({status:"not_implemented"});const p=payment.safeParse(r.body);if(!p.success)return reply.code(400).send({status:"invalid_request",issues:p.error.flatten()});return reply.code(201).send({data:await repository.paySupplierInvoice(c,p.data)});});
}
