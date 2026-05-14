"use server";

import { db } from "@/db";
import { user, follow, baby, step } from "@/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, and, or, desc, inArray } from "drizzle-orm";
import { UserError, runAction } from "@/lib/errors";
import type { FollowedUser, UserProfile } from "@/types";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new UserError("Unauthorized");
  return session;
}

// ── Parent Profile ──────────────────────────────────────────────────────────

export async function getParentProfile() {
  return runAction("getParentProfile", async () => {
    const session = await getSession();
    const [u] = await db
      .select({
        name: user.name,
        image: user.image,
        bio: user.bio,
        location: user.location,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);
    return u ?? { name: "", image: null, bio: null, location: null };
  });
}

export async function updateParentProfile(data: {
  name?: string;
  image?: string;
  bio?: string;
  location?: string;
}) {
  return runAction("updateParentProfile", async () => {
    const session = await getSession();
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (!trimmed || trimmed.length > 100) throw new UserError("Invalid name");
      updates.name = trimmed;
    }
    if (data.image !== undefined) updates.image = data.image || null;
    if (data.bio !== undefined) updates.bio = data.bio.trim().slice(0, 160) || null;
    if (data.location !== undefined) updates.location = data.location.trim().slice(0, 100) || null;

    await db.update(user).set(updates).where(eq(user.id, session.user.id));
    revalidatePath("/settings");
    revalidatePath("/following");
  });
}

export async function getUserProfile(targetUserId: string): Promise<UserProfile | null> {
  return runAction("getUserProfile", async () => {
    const session = await getSession();

    const [[targetUser], [followRow]] = await Promise.all([
      db
        .select({
          id: user.id,
          name: user.name,
          image: user.image,
          bio: user.bio,
          location: user.location,
        })
        .from(user)
        .where(eq(user.id, targetUserId))
        .limit(1),
      db
        .select({ status: follow.status })
        .from(follow)
        .where(and(eq(follow.followerId, session.user.id), eq(follow.followingId, targetUserId)))
        .limit(1),
    ]);

    if (!targetUser) return null;

    const followStatus =
      followRow?.status === "accepted"
        ? ("accepted" as const)
        : followRow?.status === "pending"
          ? ("pending" as const)
          : ("none" as const);

    // Babies — only visible if following has been accepted
    let babies: { id: string; name: string; photoUrl: string | null; birthdate: string }[] = [];
    if (followStatus === "accepted") {
      babies = await db
        .select({
          id: baby.id,
          name: baby.name,
          photoUrl: baby.photoUrl,
          birthdate: baby.birthdate,
        })
        .from(baby)
        .where(eq(baby.userId, targetUserId))
        .orderBy(desc(baby.createdAt));
    }

    return {
      id: targetUser.id,
      name: targetUser.name,
      image: targetUser.image ?? null,
      bio: targetUser.bio ?? null,
      location: targetUser.location ?? null,
      followStatus,
      babies,
    };
  });
}

// ── Follow actions ──────────────────────────────────────────────────────────

export async function unfollowUser(targetUserId: string) {
  return runAction("unfollowUser", async () => {
    const session = await getSession();

    // Atomic mutual disconnect: both directions removed in a single statement.
    await db
      .delete(follow)
      .where(
        or(
          and(eq(follow.followerId, session.user.id), eq(follow.followingId, targetUserId)),
          and(eq(follow.followerId, targetUserId), eq(follow.followingId, session.user.id))
        )
      );

    revalidatePath("/following");
  });
}

export async function removeFollower(followId: string) {
  return runAction("removeFollower", async () => {
    const session = await getSession();

    // Resolve the other party from the follow row, then remove both directions.
    const [row] = await db
      .select({ followerId: follow.followerId })
      .from(follow)
      .where(and(eq(follow.id, followId), eq(follow.followingId, session.user.id)))
      .limit(1);
    if (!row) return;

    await db
      .delete(follow)
      .where(
        or(
          and(eq(follow.id, followId), eq(follow.followingId, session.user.id)),
          and(eq(follow.followerId, session.user.id), eq(follow.followingId, row.followerId))
        )
      );

    revalidatePath("/settings");
    revalidatePath("/following");
  });
}

// ── Data fetching ───────────────────────────────────────────────────────────

export async function getFollowedUsers(): Promise<FollowedUser[]> {
  return runAction("getFollowedUsers", async () => {
    const session = await getSession();

    const accepted = await db
      .select({
        userId: user.id,
        userName: user.name,
        userImage: user.image,
        userLocation: user.location,
      })
      .from(follow)
      .innerJoin(user, eq(follow.followingId, user.id))
      .where(and(eq(follow.followerId, session.user.id), eq(follow.status, "accepted")));

    if (accepted.length === 0) return [];

    // Fetch babies for all followed users in one query
    const userIds = accepted.map((u) => u.userId);
    const allBabies = await db
      .select({
        id: baby.id,
        name: baby.name,
        photoUrl: baby.photoUrl,
        birthdate: baby.birthdate,
        userId: baby.userId,
      })
      .from(baby)
      .where(inArray(baby.userId, userIds))
      .orderBy(desc(baby.createdAt));

    const babyMap = new Map<string, typeof allBabies>();
    for (const b of allBabies) {
      const existing = babyMap.get(b.userId) ?? [];
      existing.push(b);
      babyMap.set(b.userId, existing);
    }

    return accepted.map((u) => ({
      id: u.userId,
      name: u.userName,
      image: u.userImage ?? null,
      location: u.userLocation ?? null,
      babies: (babyMap.get(u.userId) ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        photoUrl: b.photoUrl,
        birthdate: b.birthdate,
      })),
    }));
  });
}

export async function getFollowers(): Promise<
  { id: string; followerId: string; name: string; image: string | null }[]
> {
  return runAction("getFollowers", async () => {
    const session = await getSession();

    const followers = await db
      .select({
        id: follow.id,
        followerId: follow.followerId,
        name: user.name,
        image: user.image,
      })
      .from(follow)
      .innerJoin(user, eq(follow.followerId, user.id))
      .where(and(eq(follow.followingId, session.user.id), eq(follow.status, "accepted")))
      .orderBy(desc(follow.createdAt));

    return followers.map((f) => ({
      ...f,
      image: f.image ?? null,
    }));
  });
}

export async function getFollowedUserTimeline(targetUserId: string, babyId: string) {
  return runAction("getFollowedUserTimeline", async () => {
    const session = await getSession();

    // Verify follow access
    const [followRow] = await db
      .select()
      .from(follow)
      .where(
        and(
          eq(follow.followerId, session.user.id),
          eq(follow.followingId, targetUserId),
          eq(follow.status, "accepted")
        )
      )
      .limit(1);

    if (!followRow) throw new UserError("Not authorized to view this user's content");

    // Verify baby belongs to target user
    const [targetBaby] = await db
      .select()
      .from(baby)
      .where(and(eq(baby.id, babyId), eq(baby.userId, targetUserId)))
      .limit(1);

    if (!targetBaby) throw new UserError("Baby not found");

    const allSteps = await db
      .select()
      .from(step)
      .where(eq(step.babyId, babyId))
      .orderBy(step.date, step.createdAt);

    return { baby: targetBaby, steps: allSteps };
  });
}
