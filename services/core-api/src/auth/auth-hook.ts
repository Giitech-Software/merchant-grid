import type { FastifyInstance, FastifyRequest } from "fastify";
import type { SessionVerifier } from "./session-context.js";
import { toRequestContext } from "./session-context.js";

export function registerAuthenticationHook(app: FastifyInstance, verifier: SessionVerifier): void {
  app.addHook("preHandler", async (request, reply) => {
    if (request.url === "/health") return;

    const session = await verifier.verify(request as FastifyRequest);
    if (!session) {
      await reply.code(401).send({ status: "unauthenticated" });
      return;
    }

    request.requestContext = toRequestContext(request, session);
  });
}
