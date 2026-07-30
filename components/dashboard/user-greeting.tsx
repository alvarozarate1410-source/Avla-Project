"use client";

import { useUser } from "@/components/layout/user-context";

export function UserGreeting() {
  const user = useUser();
  const firstName = user.nombre.split(" ")[0];
  return <h2 className="text-2xl font-semibold tracking-tight">Hola, {firstName} 👋</h2>;
}
