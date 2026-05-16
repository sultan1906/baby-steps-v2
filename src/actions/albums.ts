"use server";

import { db } from "@/db";
import { album, albumStep, step } from "@/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, inArray } from "drizzle-orm";
import { UserError, runAction } from "@/lib/errors";
import { assertBabyAccess, hasBabyAccess } from "@/lib/baby-access";
import type { Album } from "@/db/schema";

const MAX_NAME_LENGTH = 80;

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new UserError("Unauthorized");
  return session;
}

function normalizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new UserError("Album name is required");
  if (trimmed.length > MAX_NAME_LENGTH) throw new UserError("Album name too long");
  return trimmed;
}

export async function createAlbum(input: {
  name: string;
  stepIds: string[];
  coverStepId: string;
}): Promise<Album> {
  return runAction("createAlbum", async () => {
    const session = await getSession();
    const name = normalizeName(input.name);

    if (input.stepIds.length === 0) throw new UserError("Select at least one photo");
    if (!input.stepIds.includes(input.coverStepId)) {
      throw new UserError("Cover must be one of the selected photos");
    }

    const foundSteps = await db
      .select({ id: step.id, babyId: step.babyId })
      .from(step)
      .where(inArray(step.id, input.stepIds));

    if (foundSteps.length !== input.stepIds.length) {
      throw new UserError("One or more photos not found or unauthorized");
    }

    const babyId = foundSteps[0].babyId;
    if (!foundSteps.every((s) => s.babyId === babyId)) {
      throw new UserError("All photos must belong to the same baby");
    }

    await assertBabyAccess(babyId, session.user.id);

    const [created] = await db
      .insert(album)
      .values({ babyId, name, coverStepId: input.coverStepId })
      .returning();

    await db.insert(albumStep).values(
      input.stepIds.map((stepId) => ({
        albumId: created.id,
        stepId,
      }))
    );

    revalidatePath("/gallery");
    return created;
  });
}

export async function renameAlbum(albumId: string, name: string): Promise<Album> {
  return runAction("renameAlbum", async () => {
    const session = await getSession();
    const trimmed = normalizeName(name);

    const [found] = await db
      .select({ id: album.id, babyId: album.babyId })
      .from(album)
      .where(eq(album.id, albumId))
      .limit(1);
    if (!found) throw new UserError("Album not found or unauthorized");
    const allowed = await hasBabyAccess(found.babyId, session.user.id);
    if (!allowed) throw new UserError("Album not found or unauthorized");

    const [updated] = await db
      .update(album)
      .set({ name: trimmed })
      .where(eq(album.id, albumId))
      .returning();

    revalidatePath("/gallery");
    return updated;
  });
}

export async function deleteAlbum(albumId: string): Promise<void> {
  return runAction("deleteAlbum", async () => {
    const session = await getSession();

    const [found] = await db
      .select({ id: album.id, babyId: album.babyId })
      .from(album)
      .where(eq(album.id, albumId))
      .limit(1);
    if (!found) throw new UserError("Album not found or unauthorized");
    const allowed = await hasBabyAccess(found.babyId, session.user.id);
    if (!allowed) throw new UserError("Album not found or unauthorized");

    await db.delete(album).where(eq(album.id, albumId));

    revalidatePath("/gallery");
  });
}
