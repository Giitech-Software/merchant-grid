import type { FastifyRequest } from "fastify";
import type { RequestContext } from "../security/request-context.js";

export type VerifiedSession = {
  userId: string;
  tenantId: string;
  businessId?: string;
  locationId?: string;
  permissions: Set<string>;
};

export interface SessionVerifier {
  verify(request: FastifyRequest): Promise<VerifiedSession | null>;
}

export type VerifiedTokenClaims = {
  userId: string;
};

export interface TokenIntrospector {
  introspect(token: string): Promise<VerifiedTokenClaims | null>;
}

export interface MembershipSessionResolver {
  resolve(userId: string): Promise<VerifiedSession | null>;
}

export class BearerTokenSessionVerifier implements SessionVerifier {
  public constructor(
    private readonly introspector: TokenIntrospector,
    private readonly memberships: MembershipSessionResolver,
  ) {}

  public async verify(request: FastifyRequest): Promise<VerifiedSession | null> {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) return null;

    const token = authorization.slice("Bearer ".length).trim();
    if (!token) return null;

    const identity = await this.introspector.introspect(token);
    if (!identity) return null;

    return this.memberships.resolve(identity.userId);
  }
}

export function toRequestContext(request: FastifyRequest, session: VerifiedSession): RequestContext {
  return {
    requestId: request.id,
    userId: session.userId,
    tenantId: session.tenantId,
    permissions: session.permissions,
    ...(session.businessId ? { businessId: session.businessId } : {}),
    ...(session.locationId ? { locationId: session.locationId } : {}),
  };
}
