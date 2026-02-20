"use server";

import { db } from "@/db";
import { step } from "@/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
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
 * Delete a step by ID.
 */
async function deleteStep(stepId: string) {
  await getSession();

  await db.delete(step).where(eq(step.id, stepId));

  revalidatePath("/timeline");
  revalidatePath("/gallery");
  revalidatePath("/dashboard");
}
