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
 * In-memory user directory — there's no database yet, so this Map is the
 * "users table" for the lifetime of the server process. It resets on
 * restart and isn't shared across serverless instances; fine for this
 * single-process prototype, but swap for a real store before going further
 * than a demo.
 *
 * Cached on globalThis (not just a module-level const) because Next.js
 * compiles route handlers, layouts, and pages into separate bundle entry
 * points — a plain module singleton can end up instantiated more than once
 * per process, so two request paths would see different Maps. globalThis is
 * the one thing every entry point genuinely shares within the same process.
 */
const globalForUsers = globalThis as unknown as { __avlaUsers?: Map<string, UserRecord> };

const users = globalForUsers.__avlaUsers ?? new Map<string, UserRecord>();
if (!globalForUsers.__avlaUsers) {
  globalForUsers.__avlaUsers = users;
}

function seed() {
  const demoHash = bcrypt.hashSync("avla2026", 10);
  const now = new Date().toISOString();
  users.set("diego.fernandez", {
    username: "diego.fernandez",
    passwordHash: demoHash,
    nombre: "Diego Fernández",
    rol: "Practicante Comercial",
    avatarUrl: null,
    createdAt: now,
  });
  users.set("mariana.torres", {
    username: "mariana.torres",
    passwordHash: demoHash,
    nombre: "Mariana Torres",
    rol: "Ejecutivo Comercial",
    avatarUrl: null,
    createdAt: now,
  });
}
seed();

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function findUser(username: string): UserRecord | undefined {
  return users.get(normalizeUsername(username));
}

export function findPublicProfile(username: string): PublicProfile | undefined {
  const user = findUser(username);
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
  users.set(username, user);
  return toPublicProfile(user);
}

export function updateProfile(username: string, updates: { nombre?: string; avatarUrl?: string | null }): PublicProfile | undefined {
  const user = findUser(username);
  if (!user) return undefined;
  if (updates.nombre !== undefined && updates.nombre.trim()) user.nombre = updates.nombre.trim();
  if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;
  return toPublicProfile(user);
}

export async function updatePassword(username: string, newPassword: string): Promise<boolean> {
  const user = findUser(username);
  if (!user) return false;
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  return true;
}
