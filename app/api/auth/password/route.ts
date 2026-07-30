import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findUser, verifyPassword, updatePassword } from "@/lib/auth/users";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres." }, { status: 400 });
  }

  const user = await findUser(session.username);
  if (!user || !(await verifyPassword(user, currentPassword))) {
    return NextResponse.json({ error: "La contraseña actual no es correcta." }, { status: 401 });
  }

  await updatePassword(session.username, newPassword);
  return NextResponse.json({ ok: true });
}
