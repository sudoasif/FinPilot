import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  encodeSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
  type SessionUser,
} from "@/lib/session-token";

export { SESSION_COOKIE } from "@/lib/session-token";
export type { SessionUser } from "@/lib/session-token";

export const DEMO_EMAIL = "demo@finpilot.ai";
export const DEMO_PASSWORD = "finpilot123";

export function validateCredentials(email: string, password: string) {
  return (
    email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD
  );
}

export async function createSession() {
  const payload: SessionUser = {
    email: DEMO_EMAIL,
    name: "Asif Mallick",
    workspace: "FinPilot Demo Co.",
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };

  (await cookies()).set(SESSION_COOKIE, encodeSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
