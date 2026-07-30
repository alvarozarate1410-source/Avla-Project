import bcrypt from "bcryptjs";

export type Rol = "Ejecutivo Comercial" | "Practicante Comercial" | "Jefe Comercial";

export interface DemoUser {
  username: string;
  passwordHash: string;
  nombre: string;
  rol: Rol;
}

// Demo directory for the prototype — no real user database yet. Passwords are
// bcrypt-hashed even here so the pattern is right when this moves to a real
// store; swap this module for a DB-backed lookup when that happens.
export const USERS: DemoUser[] = [
  {
    username: "diego.fernandez",
    passwordHash: bcrypt.hashSync("avla2026", 10),
    nombre: "Diego Fernández",
    rol: "Practicante Comercial",
  },
  {
    username: "mariana.torres",
    passwordHash: bcrypt.hashSync("avla2026", 10),
    nombre: "Mariana Torres",
    rol: "Ejecutivo Comercial",
  },
];

export function findUser(username: string): DemoUser | undefined {
  return USERS.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
}

export async function verifyPassword(user: DemoUser, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}
