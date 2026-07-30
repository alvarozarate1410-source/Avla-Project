import crypto from "node:crypto";
import type { Rol } from "@/lib/auth/users";

export const SESSION_COOKIE = "avla_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const SECRET = process.env.SESSION_SECRET || "avla-nexus-dev-secret-change-me";

export interface SessionPayload {
  username: string;
  nombre: string;
  rol: Rol;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function createSessionToken(payload: SessionPayload): string {
  const json = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${json}.${sign(json)}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [json, sig] = token.split(".");
  if (!json || !sig) return null;

  const expected = sign(json);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(json, "base64url").toString("utf8"));
    if (typeof parsed?.username !== "string" || typeof parsed?.nombre !== "string" || typeof parsed?.rol !== "string") {
      return null;
    }
    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
