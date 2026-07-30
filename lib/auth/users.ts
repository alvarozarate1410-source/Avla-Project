import fs from "node:fs";
import path from "node:path";
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
 * There's no database yet, so this file is the "users table" for this
 * prototype. It's stored on disk (not just an in-memory Map) because
 * Next.js can serve requests from more than one worker thread/process
 * within the same run — a plain in-memory singleton isn't reliably shared
 * across all of them, which previously caused a just-registered user to be
 * invisible to some requests and trigger a login<->dashboard redirect loop.
 * Disk is the one thing every request handler in this container actually
 * shares. Swap for a real database before going further than a demo.
 */
const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

function loadFromDisk(): Map<string, UserRecord> {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as UserRecord[];
    return new Map(parsed.map((u) => [u.username, u]));
  } catch {
    return new Map();
  }
}

function saveToDisk(users: Map<string, UserRecord>) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpFile = `${DATA_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(Array.from(users.values()), null, 2));
  fs.renameSync(tmpFile, DATA_FILE);
}

function seedIfEmpty(users: Map<string, UserRecord>) {
  if (users.size > 0) return;
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
  saveToDisk(users);
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/**
 * Every read goes back to disk so a user created by one worker is
 * immediately visible to the next request, no matter which worker handles
 * it. Reads are cheap (a small JSON file) so this trades a bit of I/O for
 * correctness in a prototype that has no real database to be consistent
 * through.
 */
function readUsers(): Map<string, UserRecord> {
  const users = loadFromDisk();
  seedIfEmpty(users);
  return users;
}

export function findUser(username: string): UserRecord | undefined {
  return readUsers().get(normalizeUsername(username));
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
  const users = readUsers();
  users.set(username, user);
  saveToDisk(users);
  return toPublicProfile(user);
}

export function updateProfile(username: string, updates: { nombre?: string; avatarUrl?: string | null }): PublicProfile | undefined {
  const users = readUsers();
  const key = normalizeUsername(username);
  const user = users.get(key);
  if (!user) return undefined;
  if (updates.nombre !== undefined && updates.nombre.trim()) user.nombre = updates.nombre.trim();
  if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;
  saveToDisk(users);
  return toPublicProfile(user);
}

export async function updatePassword(username: string, newPassword: string): Promise<boolean> {
  const users = readUsers();
  const key = normalizeUsername(username);
  const user = users.get(key);
  if (!user) return false;
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  saveToDisk(users);
  return true;
}
