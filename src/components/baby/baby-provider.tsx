"use client";

import { createContext, useContext } from "react";
import type { Baby } from "@/types";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface BabyContextValue {
  baby: Baby | null;
  user: SessionUser;
  babies: Baby[];
  pendingInviteCount: number;
}

const BabyContext = createContext<BabyContextValue | null>(null);

export function BabyProvider({
  baby,
  user,
  babies,
  pendingInviteCount,
  children,
}: BabyContextValue & { children: React.ReactNode }) {
  return (
    <BabyContext.Provider value={{ baby, user, babies, pendingInviteCount }}>
      {children}
    </BabyContext.Provider>
  );
}

/** Returns context or throws — use in pages that REQUIRE a baby */
export function useBaby(): BabyContextValue & { baby: Baby } {
  const ctx = useContext(BabyContext);
  if (!ctx) throw new Error("useBaby must be used within a BabyProvider");
  if (!ctx.baby) throw new Error("useBaby requires a baby to be selected");
  return ctx as BabyContextValue & { baby: Baby };
}

/** Returns context or null — safe for pages that work without a baby */
export function useBabyOptional(): BabyContextValue | null {
  return useContext(BabyContext);
}
