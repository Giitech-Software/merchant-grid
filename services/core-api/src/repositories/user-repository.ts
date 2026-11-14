import type { RequestContext } from "../security/request-context.js";

export type CreateUserInput = { email: string; displayName: string; externalSubject?: string };
export type UserRecord = { id: string; email: string; displayName: string; status: "active" | "deactivated" | "locked" };

export interface UserRepository {
  list(context: RequestContext): Promise<readonly UserRecord[]>;
  create(context: RequestContext, input: CreateUserInput): Promise<UserRecord>;
  deactivate(context: RequestContext, userId: string): Promise<UserRecord>;
}
