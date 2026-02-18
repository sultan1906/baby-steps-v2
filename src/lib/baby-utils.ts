import { cookies } from "next/headers";
import { db } from "@/db";
import { baby } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

const COOKIE_NAME = "babysteps_current_baby";

/**
 * Read the current baby ID from the cookie (server-side).
 */
export async function getCurrentBabyId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

/**
 * Get the current baby for a user.
 * Prefers the baby stored in the cookie; falls back to the most recently created baby.
 */
export async function getCurrentBaby(userId: string) {
  const babyId = await getCurrentBabyId();

  const babies = await db
    .select()
    .from(baby)
    .where(eq(baby.userId, userId))
    .orderBy(desc(baby.createdAt));

  if (babies.length === 0) return null;
  if (!babyId) return babies[0];

  return babies.find((b) => b.id === babyId) ?? babies[0];
}

/**
 * Cookie config for setting the current baby.
 * httpOnly: false — must be readable on the client for the BabyProvider.
 */
export function currentBabyCookieConfig(babyId: string) {
  return {
    name: COOKIE_NAME,
    value: babyId,
    options: {
      httpOnly: false,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      sameSite: "lax" as const,
    },
  };
}
