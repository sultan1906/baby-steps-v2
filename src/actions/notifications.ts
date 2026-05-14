"use server";

import { db } from "@/db";
import { notification, follow, user, type Step } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { and, count, desc, eq } from "drizzle-orm";
import { UserError, runAction } from "@/lib/errors";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new UserError("Unauthorized");
  return session;
}

export type NotificationItem = {
  id: string;
  type: string;
  photoCount: number;
  stepId: string | null;
  babyId: string;
  previewPhotoUrl: string | null;
  read: boolean;
  createdAt: Date;
  actor: { id: string; name: string; image: string | null };
};

/**
 * Fan out one notification per accepted follower of `actorId` for a batch of
 * newly-created steps. Only steps with a photoUrl count.
 *
 * Internal — called from createStep / createBulkSteps. Failures here MUST NOT
 * roll back the step insert; callers wrap in try/catch.
 */
export async function fanoutPhotoNotifications(args: {
  sessionUserId: string;
  actorId: string;
  babyId: string;
  steps: Pick<Step, "id" | "photoUrl">[];
}) {
  if (args.sessionUserId !== args.actorId) throw new UserError("Unauthorized");

  const photoSteps = args.steps.filter((s) => !!s.photoUrl);
  if (photoSteps.length === 0) return;

  const followers = await db
    .select({ followerId: follow.followerId })
    .from(follow)
    .where(and(eq(follow.followingId, args.actorId), eq(follow.status, "accepted")));

  if (followers.length === 0) return;

  // First photo represents the batch: stable preview thumbnail and link target
  // shared by every recipient row in this fanout.
  const first = photoSteps[0];
  const rows = followers.map((f) => ({
    userId: f.followerId,
    actorId: args.actorId,
    babyId: args.babyId,
    type: "new_photos",
    photoCount: photoSteps.length,
    stepId: first.id,
    previewPhotoUrl: first.photoUrl,
  }));

  await db.insert(notification).values(rows);
}

export async function getNotifications(limit = 30): Promise<NotificationItem[]> {
  return runAction("getNotifications", async () => {
    const session = await getSession();

    const rows = await db
      .select({
        id: notification.id,
        type: notification.type,
        photoCount: notification.photoCount,
        stepId: notification.stepId,
        babyId: notification.babyId,
        previewPhotoUrl: notification.previewPhotoUrl,
        read: notification.read,
        createdAt: notification.createdAt,
        actorId: user.id,
        actorName: user.name,
        actorImage: user.image,
      })
      .from(notification)
      .innerJoin(user, eq(notification.actorId, user.id))
      .where(eq(notification.userId, session.user.id))
      .orderBy(desc(notification.createdAt))
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      photoCount: r.photoCount,
      stepId: r.stepId,
      babyId: r.babyId,
      previewPhotoUrl: r.previewPhotoUrl,
      read: r.read,
      createdAt: r.createdAt,
      actor: { id: r.actorId, name: r.actorName, image: r.actorImage ?? null },
    }));
  });
}

export async function getUnreadCount(): Promise<number> {
  return runAction("getUnreadCount", async () => {
    const session = await getSession();
    const [row] = await db
      .select({ value: count() })
      .from(notification)
      .where(and(eq(notification.userId, session.user.id), eq(notification.read, false)));
    return row?.value ?? 0;
  });
}

export async function markAllRead() {
  return runAction("markAllRead", async () => {
    const session = await getSession();
    await db
      .update(notification)
      .set({ read: true })
      .where(and(eq(notification.userId, session.user.id), eq(notification.read, false)));
  });
}
