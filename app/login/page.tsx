import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { findPublicProfile } from "@/lib/auth/users";
import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  // A session cookie can verify (it's just a signature check) even if the
  // account behind it no longer resolves. Only bounce to the dashboard when
  // the profile actually exists — otherwise this page and the workspace
  // layout's own redirect-to-login would bounce the user back and forth
  // forever.
  const profile = session ? await findPublicProfile(session.username) : undefined;

  if (session && profile) redirect("/dashboard");

  return <LoginForm />;
}
