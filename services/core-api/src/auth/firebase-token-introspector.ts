import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import type { TokenIntrospector, VerifiedTokenClaims } from "./session-context.js";

export class FirebaseTokenIntrospector implements TokenIntrospector {
  private readonly auth: Auth;

  public constructor(app: App = FirebaseTokenIntrospector.defaultApp()) {
    this.auth = getAuth(app);
  }

  public async introspect(token: string): Promise<VerifiedTokenClaims | null> {
    try {
      const decoded = await this.auth.verifyIdToken(token, true);
      return { userId: decoded.uid };
    } catch {
      return null;
    }
  }

  private static defaultApp(): App {
    const existing = getApps()[0];
    if (existing) return existing;

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Firebase Admin credentials are required");
    }

    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }
}
