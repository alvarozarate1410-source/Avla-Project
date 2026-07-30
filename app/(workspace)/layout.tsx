import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { UserProvider } from "@/components/layout/user-context";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) redirect("/login");

  return (
    <UserProvider user={session}>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </UserProvider>
  );
}
