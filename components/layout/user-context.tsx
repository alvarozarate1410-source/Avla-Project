"use client";

import { createContext, useContext } from "react";
import type { SessionPayload } from "@/lib/auth/session";

const UserContext = createContext<SessionPayload | null>(null);

export function UserProvider({ user, children }: { user: SessionPayload; children: React.ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser(): SessionPayload {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error("useUser must be used within a UserProvider (i.e. inside the authenticated workspace layout)");
  }
  return user;
}
