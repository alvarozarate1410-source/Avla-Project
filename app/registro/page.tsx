import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { RegisterForm } from "@/app/registro/register-form";

export default async function RegistroPage() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (session) redirect("/dashboard");

  return <RegisterForm />;
}
