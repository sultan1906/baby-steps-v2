"use server";

import { db } from "@/db";
import { step } from "@/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { UserError, runAction } from "@/lib/errors";
import { assertBabyAccess, assertBabiesAccessible, hasBabyAccess } from "@/lib/baby-access";
import { fanoutPhotoNotifications } from "./notifications";
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
    await assertBabyAccess(data.babyId, session.user.id);

    const [s] = await db.insert(step).values(data).returning();

    if (s.photoUrl) {
      try {
        await fanoutPhotoNotifications({
          actorId: session.user.id,
          babyId: s.babyId,
          steps: [s],
        });
      } catch (err) {
        console.error("[action:createStep] notification fanout failed", err);
      }
    }

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
    if (steps.length === 0) return [];
    const session = await getSession();

    const babyIds = Array.from(new Set(steps.map((s) => s.babyId)));
    await assertBabiesAccessible(babyIds, session.user.id);

    const created = await db.insert(step).values(steps).returning();

    // Fan out one notification per (baby, follower) batch — group photos by babyId.
    try {
      const photoSteps = created.filter((s) => !!s.photoUrl);
      const byBaby = new Map<string, typeof photoSteps>();
      for (const s of photoSteps) {
        const arr = byBaby.get(s.babyId) ?? [];
        arr.push(s);
        byBaby.set(s.babyId, arr);
      }
      await Promise.all(
        Array.from(byBaby.entries()).map(([babyId, group]) =>
          fanoutPhotoNotifications({
            actorId: session.user.id,
            babyId,
            steps: group,
          })
        )
      );
    } catch (err) {
      console.error("[action:createBulkSteps] notification fanout failed", err);
    }

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
      .select({ id: step.id, babyId: step.babyId })
      .from(step)
      .where(eq(step.id, stepId))
      .limit(1);
    if (!found) throw new UserError("Not found or unauthorized");
    const allowed = await hasBabyAccess(found.babyId, session.user.id);
    if (!allowed) throw new UserError("Not found or unauthorized");

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
      .select({
        id: step.id,
        babyId: step.babyId,
        photoUrl: step.photoUrl,
        posterUrl: step.posterUrl,
      })
      .from(step)
      .where(eq(step.id, stepId))
      .limit(1);
    if (!found) throw new UserError("Not found or unauthorized");
    const allowed = await hasBabyAccess(found.babyId, session.user.id);
    if (!allowed) throw new UserError("Not found or unauthorized");

    const blobsToDelete = [found.photoUrl, found.posterUrl].filter((u): u is string => Boolean(u));
    const results = await Promise.allSettled(blobsToDelete.map((u) => del(u)));
    after(() => {
      for (const [i, r] of results.entries()) {
        if (r.status === "rejected") {
          console.warn("[action:deleteStep] blob delete failed", {
            url: blobsToDelete[i],
            error: r.reason,
          });
        }
      }
    });

    await db.delete(step).where(eq(step.id, stepId));

    revalidatePath("/timeline");
    revalidatePath("/gallery");
    revalidatePath("/dashboard");
  });
}
