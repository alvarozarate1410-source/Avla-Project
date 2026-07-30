import { NextRequest, NextResponse } from "next/server";
import { createUser, findUser, type Rol } from "@/lib/auth/users";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/session";

const VALID_ROLES: Rol[] = ["Ejecutivo Comercial", "Practicante Comercial", "Jefe Comercial"];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : "";
  const rol = typeof body?.rol === "string" && VALID_ROLES.includes(body.rol as Rol) ? (body.rol as Rol) : "Practicante Comercial";

  if (!username || !/^[a-z0-9._-]{3,40}$/i.test(username)) {
    return NextResponse.json({ error: "El usuario debe tener entre 3 y 40 caracteres (letras, números, puntos, guiones)." }, { status: 400 });
  }
  if (!nombre || nombre.length < 3) {
    return NextResponse.json({ error: "Ingresa tu nombre completo." }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
  }
  if (findUser(username)) {
    return NextResponse.json({ error: "Ese usuario ya existe. Intenta con otro o inicia sesión." }, { status: 409 });
  }

  const profile = await createUser({ username, password, nombre, rol });
  const token = createSessionToken({ username: profile.username });
  const res = NextResponse.json({ nombre: profile.nombre, rol: profile.rol });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
