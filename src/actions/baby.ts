"use server";

import { db } from "@/db";
import { baby, step, dailyDescription } from "@/db/schema";
import { auth } from "@/lib/auth";
import { currentBabyCookieConfig } from "@/lib/baby-utils";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import { eq, and, desc } from "drizzle-orm";
import type { NewBaby } from "@/db/schema";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

/**
 * Create a new baby, auto-create the "Arrival" milestone step and first
 * daily description, then set the current baby cookie.
 */
export async function createBaby(data: { name: string; birthdate: string; photoUrl?: string }) {
  const session = await getSession();

  const [newBaby] = await db
    .insert(baby)
    .values({
      userId: session.user.id,
      name: data.name,
      birthdate: data.birthdate,
      photoUrl: data.photoUrl,
    })
    .returning();

  // Auto-create "Arrival" milestone step
  await db.insert(step).values({
    babyId: newBaby.id,
    date: data.birthdate,
    isMajor: true,
    type: "milestone",
    title: "Arrival",
    caption: "The journey begins today.",
  });

  // Auto-create first daily description
  await db.insert(dailyDescription).values({
    babyId: newBaby.id,
    date: data.birthdate,
    description: "The journey begins today.",
  });

  // Set current baby cookie
  const cookieStore = await cookies();
  const { name, value, options } = currentBabyCookieConfig(newBaby.id);
  cookieStore.set(name, value, options);

  revalidatePath("/timeline");
  return newBaby;
}

/**
 * Update baby profile fields (name, birthdate, photoUrl).
 * Validates that the baby belongs to the current user.
 */
export async function updateBaby(
  id: string,
  data: Partial<Pick<NewBaby, "name" | "birthdate" | "photoUrl">>
) {
  const session = await getSession();

  const [updated] = await db
    .update(baby)
    .set(data)
    .where(and(eq(baby.id, id), eq(baby.userId, session.user.id)))
    .returning();

  revalidatePath("/settings");
  revalidatePath("/timeline");
  return updated;
}

/**
 * Delete a baby and all associated data (cascades via FK).
 * Clears the current baby cookie.
 */
export async function deleteBaby(id: string) {
  const session = await getSession();

  await db.delete(baby).where(and(eq(baby.id, id), eq(baby.userId, session.user.id)));

  const cookieStore = await cookies();
  cookieStore.delete("babysteps_current_baby");

  revalidatePath("/timeline");
  revalidatePath("/settings");
}

/**
 * List all babies for the current user, newest first.
 */
export async function listBabies() {
  const session = await getSession();
  return db
    .select()
    .from(baby)
    .where(eq(baby.userId, session.user.id))
    .orderBy(desc(baby.createdAt));
}

/**
 * Switch the active baby by setting the cookie.
 * Validates the baby belongs to the current user.
 */
export async function switchBaby(babyId: string) {
  const session = await getSession();

  const [found] = await db
    .select()
    .from(baby)
    .where(and(eq(baby.id, babyId), eq(baby.userId, session.user.id)))
    .limit(1);

  if (!found) throw new Error("Baby not found");

  const cookieStore = await cookies();
  const { name, value, options } = currentBabyCookieConfig(babyId);
  cookieStore.set(name, value, options);

  revalidatePath("/timeline");
}
