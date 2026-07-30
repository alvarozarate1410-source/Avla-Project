import { Redis } from "@upstash/redis";
import bcrypt from "bcryptjs";

export type Rol = "Ejecutivo Comercial" | "Practicante Comercial" | "Jefe Comercial";

export interface UserRecord {
  username: string;
  passwordHash: string;
  nombre: string;
  rol: Rol;
  avatarUrl: string | null;
  createdAt: string;
}

export type PublicProfile = Omit<UserRecord, "passwordHash">;

function toPublicProfile(user: UserRecord): PublicProfile {
  const { username, nombre, rol, avatarUrl, createdAt } = user;
  return { username, nombre, rol, avatarUrl, createdAt };
}

/**
 * There's no database yet, so a Redis store (Upstash, connected as a
 * Vercel Marketplace "Redis" integration) is the "users table" for this
 * prototype. This is not a stylistic choice — Vercel's serverless
 * functions have a read-only filesystem outside of /tmp, and /tmp itself
 * doesn't survive between invocations or across instances, so anything
 * written to disk from a route handler is invisible to (or gone before)
 * the next request. Redis is the one thing every invocation actually
 * shares. Swap for a real relational database if this grows past a demo.
 *
 * Connect it in the Vercel dashboard: Project -> Storage -> Create Database
 * -> Redis (Upstash). That auto-populates KV_REST_API_URL/KV_REST_API_TOKEN
 * (legacy naming, still used by the integration) in Production/Preview/
 * Development env vars. If you connected Upstash directly instead, it uses
 * UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN — both are supported here.
 * For local dev, run `vercel env pull .env.local` after connecting it so
 * `next dev` talks to the same store.
 */
// Built lazily (on first actual Redis call) rather than at module import
// time: this file is imported from every page under the workspace layout,
// including ones an unauthenticated visitor can reach, and we don't want a
// missing env var to break page evaluation itself — only the specific
// request that needed the user directory should fail, with a clear reason.
const globalForRedis = globalThis as unknown as { __avlaRedis?: Redis };

function getRedis(): Redis {
  if (globalForRedis.__avlaRedis) return globalForRedis.__avlaRedis;

  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "No Redis credentials found (expected KV_REST_API_URL/KV_REST_API_TOKEN or " +
        "UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN). Connect a Redis database " +
        "to this project in the Vercel dashboard (Storage -> Create Database -> Redis), " +
        "or run `vercel env pull .env.local` for local development."
    );
  }
  const redis = new Redis({ url, token, enableAutoPipelining: false });
  globalForRedis.__avlaRedis = redis;
  return redis;
}

const userKey = (username: string) => `avla:user:${username}`;

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

let seeded = false;
async function seedIfNeeded() {
  if (seeded) return;
  seeded = true;
  const demoHash = bcrypt.hashSync("avla2026", 10);
  const now = new Date().toISOString();
  const demoUsers: UserRecord[] = [
    { username: "diego.fernandez", passwordHash: demoHash, nombre: "Diego Fernández", rol: "Practicante Comercial", avatarUrl: null, createdAt: now },
    { username: "mariana.torres", passwordHash: demoHash, nombre: "Mariana Torres", rol: "Ejecutivo Comercial", avatarUrl: null, createdAt: now },
  ];
  // NX = only set if absent, so this never clobbers a password someone
  // actually changed on one of the demo accounts.
  await Promise.all(demoUsers.map((u) => getRedis().set(userKey(u.username), u, { nx: true })));
}

export async function findUser(username: string): Promise<UserRecord | undefined> {
  await seedIfNeeded();
  const user = await getRedis().get<UserRecord>(userKey(normalizeUsername(username)));
  return user ?? undefined;
}

export async function findPublicProfile(username: string): Promise<PublicProfile | undefined> {
  const user = await findUser(username);
  return user ? toPublicProfile(user) : undefined;
}

export async function verifyPassword(user: UserRecord, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}

export interface CreateUserInput {
  username: string;
  password: string;
  nombre: string;
  rol: Rol;
}

export async function createUser(input: CreateUserInput): Promise<PublicProfile> {
  await seedIfNeeded();
  const username = normalizeUsername(input.username);
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user: UserRecord = {
    username,
    passwordHash,
    nombre: input.nombre.trim(),
    rol: input.rol,
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  };
  await getRedis().set(userKey(username), user);
  return toPublicProfile(user);
}

export async function updateProfile(username: string, updates: { nombre?: string; avatarUrl?: string | null }): Promise<PublicProfile | undefined> {
  const key = userKey(normalizeUsername(username));
  const user = await getRedis().get<UserRecord>(key);
  if (!user) return undefined;
  if (updates.nombre !== undefined && updates.nombre.trim()) user.nombre = updates.nombre.trim();
  if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;
  await getRedis().set(key, user);
  return toPublicProfile(user);
}

export async function updatePassword(username: string, newPassword: string): Promise<boolean> {
  const key = userKey(normalizeUsername(username));
  const user = await getRedis().get<UserRecord>(key);
  if (!user) return false;
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await getRedis().set(key, user);
  return true;
}
