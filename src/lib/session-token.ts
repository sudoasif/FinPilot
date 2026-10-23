import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "finpilot_session";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const SESSION_SECRET =
  process.env.AUTH_SECRET ??
  "finpilot-demo-secret-please-set-auth-secret-in-production";

export interface SessionUser {
  email: string;
  name: string;
  workspace: string;
  exp: number;
}

function sign(value: string) {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

export function encodeSession(payload: SessionUser) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const given = Buffer.from(signature);
  const computed = Buffer.from(expected);
  if (given.length !== computed.length) return null;
  if (!timingSafeEqual(given, computed)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionUser;
    if (!payload.email || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
