import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { findPublicProfile } from "@/lib/auth/users";
import { RegisterForm } from "@/app/registro/register-form";

export default async function RegistroPage() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  const profile = session ? findPublicProfile(session.username) : undefined;

  if (session && profile) redirect("/dashboard");

  return <RegisterForm />;
}
