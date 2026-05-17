"use server";

import { db } from "@/db";
import { baby, step, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { currentBabyCookieConfig } from "@/lib/baby-utils";
import {
  assertBabyAccess,
  listAccessibleBabies,
  listCoParents as listCoParentsForBabyImpl,
  sqlBabyWritable,
} from "@/lib/baby-access";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import { eq, and, isNull, sql } from "drizzle-orm";
import { UserError, runAction } from "@/lib/errors";
import type { NewBaby } from "@/db/schema";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new UserError("Unauthorized");
  return session;
}

/**
 * Create a new baby, auto-create the "Arrival" milestone step,
 * then set the current baby cookie.
 */
export async function createBaby(data: { name: string; birthdate: string; photoUrl?: string }) {
  return runAction("createBaby", async () => {
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

    await db
      .update(user)
      .set({ onboardedAt: new Date() })
      .where(and(eq(user.id, session.user.id), isNull(user.onboardedAt)));

    // Set current baby cookie
    const cookieStore = await cookies();
    const { name, value, options } = currentBabyCookieConfig(newBaby.id);
    cookieStore.set(name, value, options);

    revalidatePath("/timeline");
    return newBaby;
  });
}

/**
 * Update baby profile fields (name, birthdate, photoUrl).
 * Validates that the current user can access the baby (owner or co-parent).
 */
export async function updateBaby(
  id: string,
  data: Partial<Pick<NewBaby, "name" | "birthdate" | "photoUrl">>
) {
  return runAction("updateBaby", async () => {
    const session = await getSession();

    const [updated] = await db
      .update(baby)
      .set(data)
      .where(and(eq(baby.id, id), sqlBabyWritable(baby.id, session.user.id)))
      .returning();
    if (!updated) throw new UserError("Not found or unauthorized");

    revalidatePath("/settings");
    revalidatePath("/timeline");
    return updated;
  });
}

/**
 * Delete a baby and all associated data (cascades via FK).
 * Owner-only. Clears the current baby cookie.
 */
export async function deleteBaby(id: string) {
  return runAction("deleteBaby", async () => {
    const session = await getSession();

    const deleted = await db
      .delete(baby)
      .where(and(eq(baby.id, id), eq(baby.userId, session.user.id)))
      .returning({ id: baby.id });
    if (deleted.length === 0) throw new UserError("Not found or unauthorized");

    const cookieStore = await cookies();
    cookieStore.delete("babysteps_current_baby");

    revalidatePath("/timeline");
    revalidatePath("/settings");
  });
}

/**
 * List all babies the current user can access (owned + co-parented), newest first.
 */
export async function listBabies() {
  return runAction("listBabies", async () => {
    const session = await getSession();
    return listAccessibleBabies(session.user.id);
  });
}

export async function markOnboardedAsFollower() {
  return runAction("markOnboardedAsFollower", async () => {
    const session = await getSession();
    await db
      .update(user)
      .set({ onboardedAt: new Date() })
      .where(and(eq(user.id, session.user.id), isNull(user.onboardedAt)));
  });
}

/**
 * Switch the active baby by setting the cookie.
 * Validates the current user has access to the baby (owner or co-parent).
 */
export async function switchBaby(babyId: string) {
  return runAction("switchBaby", async () => {
    const session = await getSession();
    await assertBabyAccess(babyId, session.user.id);

    const cookieStore = await cookies();
    const { name, value, options } = currentBabyCookieConfig(babyId);
    cookieStore.set(name, value, options);

    revalidatePath("/timeline");
  });
}

/**
 * List co-parents for a baby, plus the owner's id (so the UI can distinguish them).
 * Any user with access can call this.
 */
export async function listCoParentsForBaby(babyId: string) {
  return runAction("listCoParentsForBaby", async () => {
    const session = await getSession();
    await assertBabyAccess(babyId, session.user.id);

    const [babyRow, coParents] = await Promise.all([
      db
        .select({ ownerId: baby.userId })
        .from(baby)
        .where(eq(baby.id, babyId))
        .limit(1)
        .then((rows) => rows[0]),
      listCoParentsForBabyImpl(babyId),
    ]);
    if (!babyRow) throw new UserError("Baby not found");
    const b = babyRow;

    const [owner] = await db
      .select({ id: user.id, name: user.name, email: user.email, image: user.image })
      .from(user)
      .where(eq(user.id, b.ownerId))
      .limit(1);

    return {
      ownerId: b.ownerId,
      isOwner: session.user.id === b.ownerId,
      owner,
      coParents,
    };
  });
}

/**
 * Remove a co-parent from a baby. Owner-only.
 * Also revokes any pending email invites addressed to this user so they cannot
 * regain access by redeeming a still-pending invite for the same baby.
 */
export async function removeCoParent(babyId: string, coParentUserId: string) {
  return runAction("removeCoParent", async () => {
    const session = await getSession();

    if (coParentUserId === session.user.id) {
      throw new UserError("Owner cannot remove themselves");
    }

    // Single atomic statement: ownership check + access delete + invite revoke
    // all run together; either all happen or none do.
    const result = await db.execute(sql`
      WITH deleted_access AS (
        DELETE FROM "baby_access"
        WHERE "baby_id" = ${babyId}
          AND "user_id" = ${coParentUserId}
          AND EXISTS (
            SELECT 1 FROM "baby" AS "b"
            WHERE "b"."id" = ${babyId} AND "b"."user_id" = ${session.user.id}
          )
        RETURNING "id"
      ),
      removed_email AS (
        SELECT lower("email") AS email FROM "user" WHERE "id" = ${coParentUserId}
      ),
      revoked_invites AS (
        UPDATE "baby_invite"
        SET "status" = 'revoked'
        WHERE "baby_id" = ${babyId}
          AND "kind" = 'email'
          AND "status" = 'pending'
          AND lower("email") = (SELECT email FROM removed_email)
          AND EXISTS (SELECT 1 FROM deleted_access)
        RETURNING "id"
      )
      SELECT (SELECT count(*) FROM deleted_access)::int AS deleted_count
    `);
    const rows =
      (result as unknown as { rows?: { deleted_count: number }[] }).rows ??
      (result as unknown as { deleted_count: number }[]);
    const deletedCount = Array.isArray(rows) ? Number(rows[0]?.deleted_count ?? 0) : 0;
    if (deletedCount === 0) throw new UserError("Not found or unauthorized");

    revalidatePath("/settings");
    revalidatePath("/settings/baby");
  });
}
