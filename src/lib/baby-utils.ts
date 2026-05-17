import { cookies } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { listAccessibleBabies } from "@/lib/baby-access";

const COOKIE_NAME = "babysteps_current_baby";

/**
 * Read the current baby ID from the cookie (server-side).
 */
async function getCurrentBabyId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

/**
 * Get the current baby for a user (owner or co-parent).
 * Prefers the baby stored in the cookie; falls back to the most recently created accessible baby.
 */
export async function getCurrentBaby(userId: string) {
  const [babyId, babies] = await Promise.all([getCurrentBabyId(), listAccessibleBabies(userId)]);

  if (babies.length === 0) return null;
  if (!babyId) return babies[0];

  return babies.find((b) => b.id === babyId) ?? babies[0];
}

export async function resolveNoBabyDestination(
  userId: string
): Promise<"/onboarding" | "/following"> {
  const [row] = await db
    .select({ onboardedAt: user.onboardedAt })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return row?.onboardedAt ? "/following" : "/onboarding";
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
