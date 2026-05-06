"use server";

import { db } from "@/db";
import { step, baby } from "@/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, and, inArray } from "drizzle-orm";
import { del } from "@vercel/blob";
import { UserError, runAction } from "@/lib/errors";
import type { StepInput } from "@/types";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new UserError("Unauthorized");
  return session;
}

/**
 * Create a single step (photo, video, first word, or milestone).
 */
export async function createStep(data: StepInput) {
  return runAction("createStep", async () => {
    const session = await getSession();

    const [owned] = await db
      .select({ id: baby.id })
      .from(baby)
      .where(and(eq(baby.id, data.babyId), eq(baby.userId, session.user.id)))
      .limit(1);
    if (!owned) throw new UserError("Not found or unauthorized");

    const [s] = await db.insert(step).values(data).returning();

    revalidatePath("/timeline");
    revalidatePath("/gallery");
    revalidatePath("/dashboard");
    return s;
  });
}

/**
 * Create multiple steps at once (bulk photo upload).
 */
export async function createBulkSteps(steps: StepInput[]) {
  return runAction("createBulkSteps", async () => {
    const session = await getSession();
    if (steps.length === 0) return [];

    const babyIds = Array.from(new Set(steps.map((s) => s.babyId)));
    const owned = await db
      .select({ id: baby.id })
      .from(baby)
      .where(and(inArray(baby.id, babyIds), eq(baby.userId, session.user.id)));
    if (owned.length !== babyIds.length) {
      throw new UserError("Not found or unauthorized");
    }

    const created = await db.insert(step).values(steps).returning();

    revalidatePath("/timeline");
    revalidatePath("/gallery");
    revalidatePath("/dashboard");
    return created;
  });
}

const MAX_CAPTION_LENGTH = 2000;

/**
 * Update a single step's caption (the per-photo description).
 * Verifies ownership via baby.userId.
 */
export async function updateStepCaption(stepId: string, caption: string) {
  return runAction("updateStepCaption", async () => {
    const session = await getSession();

    const trimmed = caption.trim();
    if (trimmed.length > MAX_CAPTION_LENGTH) throw new UserError("Caption too long");

    const [found] = await db
      .select({ id: step.id })
      .from(step)
      .innerJoin(baby, eq(step.babyId, baby.id))
      .where(and(eq(step.id, stepId), eq(baby.userId, session.user.id)));

    if (!found) throw new UserError("Not found or unauthorized");

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
  });
}

/**
 * Delete a single step, verifying ownership via baby.userId.
 * Also removes the associated blob from Vercel Blob storage.
 */
export async function deleteStep(stepId: string) {
  return runAction("deleteStep", async () => {
    const session = await getSession();

    const [found] = await db
      .select({ id: step.id, photoUrl: step.photoUrl })
      .from(step)
      .innerJoin(baby, eq(step.babyId, baby.id))
      .where(and(eq(step.id, stepId), eq(baby.userId, session.user.id)));

    if (!found) throw new UserError("Not found or unauthorized");

    if (found.photoUrl) {
      await del(found.photoUrl);
    }

    await db.delete(step).where(eq(step.id, stepId));

    revalidatePath("/timeline");
    revalidatePath("/gallery");
    revalidatePath("/dashboard");
  });
}
