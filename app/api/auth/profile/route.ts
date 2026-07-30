import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateProfile } from "@/lib/auth/users";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";

const MAX_AVATAR_BYTES = 1_500_000; // ~1.5MB raw, comfortably under typical request body limits once base64-encoded

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const nombre = typeof body?.nombre === "string" ? body.nombre : undefined;
  const avatarUrl = typeof body?.avatarUrl === "string" ? body.avatarUrl : undefined;

  if (avatarUrl && (!avatarUrl.startsWith("data:image/") || avatarUrl.length > MAX_AVATAR_BYTES * 1.4)) {
    return NextResponse.json({ error: "La imagen debe ser un archivo válido de menos de 1.5MB." }, { status: 400 });
  }

  const profile = await updateProfile(session.username, { nombre, avatarUrl });
  if (!profile) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  return NextResponse.json(profile);
}
