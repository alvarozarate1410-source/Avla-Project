"use client";

import { createContext, useContext } from "react";
import type { PublicProfile } from "@/lib/auth/users";

const UserContext = createContext<PublicProfile | null>(null);

export function UserProvider({ user, children }: { user: PublicProfile; children: React.ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser(): PublicProfile {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error("useUser must be used within a UserProvider (i.e. inside the authenticated workspace layout)");
  }
  return user;
}
