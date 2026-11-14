import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AccountingRepository } from "../repositories/accounting-repository.js";
import { hasPermission } from "../security/request-context.js";
const schema=z.object({sourceType:z.string().min(1).max(50),sourceId:z.string().uuid(),description:z.string().min(2).max(500),lines:z.array(z.object({accountId:z.string().uuid(),description:z.string().max(200).optional(),debit:z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),credit:z.string().regex(/^\d+(\.\d{1,4})?$/).optional()})).min(2)});
export function registerAccountingRoutes(app:FastifyInstance,repository:AccountingRepository):void{app.post<{Body:unknown}>("/v1/accounting/journals",async(r,reply)=>{const c=r.requestContext;if(!c)return reply.code(401).send({status:"unauthenticated"});if(!hasPermission(c,"accounting.post" as never))return reply.code(403).send({status:"forbidden"});const p=schema.safeParse(r.body);if(!p.success)return reply.code(400).send({status:"invalid_request",issues:p.error.flatten()});return reply.code(201).send({data:await repository.postJournal(c,p.data)});});}
