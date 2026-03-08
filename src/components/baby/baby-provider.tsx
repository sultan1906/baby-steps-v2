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
  baby: Baby;
  user: SessionUser;
  babies: Baby[];
  pendingRequestCount: number;
}

const BabyContext = createContext<BabyContextValue | null>(null);

export function BabyProvider({
  baby,
  user,
  babies,
  pendingRequestCount,
  children,
}: BabyContextValue & { children: React.ReactNode }) {
  return (
    <BabyContext.Provider value={{ baby, user, babies, pendingRequestCount }}>
      {children}
    </BabyContext.Provider>
  );
}

export function useBaby(): BabyContextValue {
  const ctx = useContext(BabyContext);
  if (!ctx) throw new Error("useBaby must be used within a BabyProvider");
  return ctx;
}
