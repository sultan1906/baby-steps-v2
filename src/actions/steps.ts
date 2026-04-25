"use server";

import { db } from "@/db";
import { step, baby } from "@/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { del } from "@vercel/blob";
import type { StepInput } from "@/types";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

/**
 * Create a single step (photo, video, first word, or milestone).
 */
export async function createStep(data: StepInput) {
  await getSession();

  const [s] = await db.insert(step).values(data).returning();

  revalidatePath("/timeline");
  revalidatePath("/gallery");
  revalidatePath("/dashboard");
  return s;
}

/**
 * Create multiple steps at once (bulk photo upload).
 */
export async function createBulkSteps(steps: StepInput[]) {
  await getSession();

  const created = await db.insert(step).values(steps).returning();

  revalidatePath("/timeline");
  revalidatePath("/gallery");
  revalidatePath("/dashboard");
  return created;
}

const MAX_CAPTION_LENGTH = 2000;

/**
 * Update a single step's caption (the per-photo description).
 * Verifies ownership via baby.userId.
 */
export async function updateStepCaption(stepId: string, caption: string) {
  const session = await getSession();

  const trimmed = caption.trim();
  if (trimmed.length > MAX_CAPTION_LENGTH) throw new Error("Caption too long");

  const [found] = await db
    .select({ id: step.id })
    .from(step)
    .innerJoin(baby, eq(step.babyId, baby.id))
    .where(and(eq(step.id, stepId), eq(baby.userId, session.user.id)));

  if (!found) throw new Error("Not found or unauthorized");

  const [updated] = await db
    .update(step)
    .set({ caption: trimmed || null })
    .where(eq(step.id, stepId))
    .returning();

  revalidatePath("/timeline");
  revalidatePath("/gallery");
  revalidatePath("/dashboard");
  revalidatePath("/following", "layout");
  return updated;
}

/**
 * Delete a single step, verifying ownership via baby.userId.
 * Also removes the associated blob from Vercel Blob storage.
 */
export async function deleteStep(stepId: string) {
  const session = await getSession();

  const [found] = await db
    .select({ id: step.id, photoUrl: step.photoUrl })
    .from(step)
    .innerJoin(baby, eq(step.babyId, baby.id))
    .where(and(eq(step.id, stepId), eq(baby.userId, session.user.id)));

  if (!found) throw new Error("Not found or unauthorized");

  if (found.photoUrl) {
    await del(found.photoUrl);
  }

  await db.delete(step).where(eq(step.id, stepId));

  revalidatePath("/timeline");
  revalidatePath("/gallery");
  revalidatePath("/dashboard");
}
