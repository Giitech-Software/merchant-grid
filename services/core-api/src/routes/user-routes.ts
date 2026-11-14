import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { UserRepository } from "../repositories/user-repository.js";
import { hasPermission } from "../security/request-context.js";

const userSchema = z.object({
  email: z.string().email().max(320),
  displayName: z.string().trim().min(2).max(150),
  externalSubject: z.string().trim().min(1).max(255).optional(),
});

export function registerUserRoutes(app: FastifyInstance, repository: UserRepository): void {
  app.get("/v1/users", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "user.manage-access")) return reply.code(403).send({ status: "forbidden" });
    return { data: await repository.list(context) };
  });

  app.post<{ Body: unknown }>("/v1/users", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "user.manage-access")) return reply.code(403).send({ status: "forbidden" });
    const parsed = userSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ status: "invalid_request", issues: parsed.error.flatten() });
    try {
      return reply.code(201).send({ data: await repository.create(context, parsed.data) });
    } catch (error) {
      if ((error as { code?: string }).code === "23505") return reply.code(409).send({ status: "conflict", message: "A user with this identity already exists" });
      throw error;
    }
  });

  app.post<{ Params: { userId: string } }>("/v1/users/:userId/deactivate", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "user.manage-access")) return reply.code(403).send({ status: "forbidden" });
    return { data: await repository.deactivate(context, request.params.userId) };
  });
}
