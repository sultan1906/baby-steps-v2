"use client";

import { createContext, useContext } from "react";
import type { Baby, User } from "@/types";

interface BabyContextValue {
  baby: Baby;
  user: User;
  babies: Baby[];
}

const BabyContext = createContext<BabyContextValue | null>(null);

export function BabyProvider({
  baby,
  user,
  babies,
  children,
}: BabyContextValue & { children: React.ReactNode }) {
  return <BabyContext.Provider value={{ baby, user, babies }}>{children}</BabyContext.Provider>;
}

export function useBaby(): BabyContextValue {
  const ctx = useContext(BabyContext);
  if (!ctx) throw new Error("useBaby must be used within a BabyProvider");
  return ctx;
}
