import { NextRequest, NextResponse } from "next/server";
import { findUser, verifyPassword } from "@/lib/auth/users";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Usuario y contraseña son obligatorios." }, { status: 400 });
  }

  const user = findUser(username);
  const valid = user ? await verifyPassword(user, password) : false;

  if (!user || !valid) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  const token = createSessionToken({ username: user.username, nombre: user.nombre, rol: user.rol });
  const res = NextResponse.json({ nombre: user.nombre, rol: user.rol });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
