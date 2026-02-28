"use server";

import { db } from "@/db";
import { step, baby, dailyDescription } from "@/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, and, count } from "drizzle-orm";
import { del } from "@vercel/blob";
import type { StepInput } from "@/types";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

/**
 * Create a single step (photo, video, growth record, first word, or milestone).
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

/**
 * Delete a single step, verifying ownership via baby.userId.
 * Also removes the associated blob from Vercel Blob storage.
 */
export async function deleteStep(stepId: string) {
  const session = await getSession();

  const [found] = await db
    .select({ id: step.id, babyId: step.babyId, date: step.date, photoUrl: step.photoUrl })
    .from(step)
    .innerJoin(baby, eq(step.babyId, baby.id))
    .where(and(eq(step.id, stepId), eq(baby.userId, session.user.id)));

  if (!found) throw new Error("Not found or unauthorized");

  if (found.photoUrl) {
    await del(found.photoUrl);
  }

  await db.delete(step).where(eq(step.id, stepId));

  // Clean up orphaned daily description if no steps remain for this date
  const [{ remaining }] = await db
    .select({ remaining: count() })
    .from(step)
    .where(and(eq(step.babyId, found.babyId), eq(step.date, found.date)));

  if (remaining === 0) {
    await db
      .delete(dailyDescription)
      .where(and(eq(dailyDescription.babyId, found.babyId), eq(dailyDescription.date, found.date)));
  }

  revalidatePath("/timeline");
  revalidatePath("/gallery");
  revalidatePath("/dashboard");
}
