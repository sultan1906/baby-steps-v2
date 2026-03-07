"use server";

import { db } from "@/db";
import { user, follow, baby, step, dailyDescription } from "@/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, and, or, ilike, count, desc, ne, inArray } from "drizzle-orm";
import type { UserSearchResult, FollowRequestItem, FollowedUser } from "@/types";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

// ── Privacy ─────────────────────────────────────────────────────────────────

export async function toggleProfilePrivacy(isPublic: boolean) {
  const session = await getSession();
  await db.update(user).set({ isPublic }).where(eq(user.id, session.user.id));
  revalidatePath("/settings");
  revalidatePath("/settings/privacy");
}

export async function getProfilePrivacy(): Promise<boolean> {
  const session = await getSession();
  const [u] = await db
    .select({ isPublic: user.isPublic })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
  return u?.isPublic ?? true;
}

// ── Search ──────────────────────────────────────────────────────────────────

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const session = await getSession();
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const searchTerm = `%${trimmed}%`;

  const results = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      isPublic: user.isPublic,
    })
    .from(user)
    .where(
      and(
        ne(user.id, session.user.id),
        or(ilike(user.name, searchTerm), ilike(user.email, searchTerm))
      )
    )
    .limit(20);

  if (results.length === 0) return [];

  // Batch-check follow status for all results
  const resultIds = results.map((r) => r.id);
  const followRows = await db
    .select({
      followingId: follow.followingId,
      status: follow.status,
    })
    .from(follow)
    .where(and(eq(follow.followerId, session.user.id), inArray(follow.followingId, resultIds)));

  const followMap = new Map(followRows.map((f) => [f.followingId, f.status]));

  return results.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    image: r.image ?? null,
    isPublic: r.isPublic,
    followStatus:
      followMap.get(r.id) === "accepted"
        ? ("accepted" as const)
        : followMap.get(r.id) === "pending"
          ? ("pending" as const)
          : ("none" as const),
  }));
}

// ── Follow actions ──────────────────────────────────────────────────────────

export async function sendFollowRequest(targetUserId: string) {
  const session = await getSession();
  if (targetUserId === session.user.id) throw new Error("Cannot follow yourself");

  // Check target exists and privacy setting
  const [target] = await db
    .select({ id: user.id, isPublic: user.isPublic })
    .from(user)
    .where(eq(user.id, targetUserId))
    .limit(1);

  if (!target) throw new Error("User not found");

  // Check for existing follow relationship
  const [existing] = await db
    .select()
    .from(follow)
    .where(and(eq(follow.followerId, session.user.id), eq(follow.followingId, targetUserId)))
    .limit(1);

  if (existing) {
    if (existing.status === "accepted") throw new Error("Already following");
    if (existing.status === "pending") throw new Error("Request already pending");
    // If previously rejected, allow re-request
    if (existing.status === "rejected") {
      const newStatus = target.isPublic ? "accepted" : "pending";
      await db
        .update(follow)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(follow.id, existing.id));
      revalidatePath("/following");
      return { status: newStatus };
    }
  }

  const status = target.isPublic ? "accepted" : "pending";

  await db.insert(follow).values({
    followerId: session.user.id,
    followingId: targetUserId,
    status,
  });

  revalidatePath("/following");
  return { status };
}

export async function unfollowUser(targetUserId: string) {
  const session = await getSession();

  await db
    .delete(follow)
    .where(and(eq(follow.followerId, session.user.id), eq(follow.followingId, targetUserId)));

  revalidatePath("/following");
}

export async function acceptFollowRequest(followId: string) {
  const session = await getSession();

  await db
    .update(follow)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(
      and(
        eq(follow.id, followId),
        eq(follow.followingId, session.user.id),
        eq(follow.status, "pending")
      )
    );

  revalidatePath("/settings");
  revalidatePath("/following");
}

export async function rejectFollowRequest(followId: string) {
  const session = await getSession();

  await db
    .update(follow)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(
      and(
        eq(follow.id, followId),
        eq(follow.followingId, session.user.id),
        eq(follow.status, "pending")
      )
    );

  revalidatePath("/settings");
  revalidatePath("/following");
}

export async function removeFollower(followId: string) {
  const session = await getSession();

  await db
    .delete(follow)
    .where(and(eq(follow.id, followId), eq(follow.followingId, session.user.id)));

  revalidatePath("/settings");
  revalidatePath("/settings/privacy");
}

// ── Data fetching ───────────────────────────────────────────────────────────

export async function getFollowRequests(): Promise<FollowRequestItem[]> {
  const session = await getSession();

  const requests = await db
    .select({
      id: follow.id,
      createdAt: follow.createdAt,
      followerId: follow.followerId,
      followerName: user.name,
      followerEmail: user.email,
      followerImage: user.image,
    })
    .from(follow)
    .innerJoin(user, eq(follow.followerId, user.id))
    .where(and(eq(follow.followingId, session.user.id), eq(follow.status, "pending")))
    .orderBy(desc(follow.createdAt));

  return requests.map((r) => ({
    id: r.id,
    follower: {
      id: r.followerId,
      name: r.followerName,
      email: r.followerEmail,
      image: r.followerImage ?? null,
    },
    createdAt: r.createdAt,
  }));
}

export async function getPendingRequestCount(): Promise<number> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return 0;

  const [result] = await db
    .select({ count: count() })
    .from(follow)
    .where(and(eq(follow.followingId, session.user.id), eq(follow.status, "pending")));

  return result?.count ?? 0;
}

export async function getFollowedUsers(): Promise<FollowedUser[]> {
  const session = await getSession();

  const accepted = await db
    .select({
      userId: user.id,
      userName: user.name,
      userImage: user.image,
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
    babies: (babyMap.get(u.userId) ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      photoUrl: b.photoUrl,
      birthdate: b.birthdate,
    })),
  }));
}

export async function getFollowers(): Promise<
  { id: string; followerId: string; name: string; email: string; image: string | null }[]
> {
  const session = await getSession();

  const followers = await db
    .select({
      id: follow.id,
      followerId: follow.followerId,
      name: user.name,
      email: user.email,
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
}

export async function getFollowedUserTimeline(targetUserId: string, babyId: string) {
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

  if (!followRow) throw new Error("Not authorized to view this user's content");

  // Verify baby belongs to target user
  const [targetBaby] = await db
    .select()
    .from(baby)
    .where(and(eq(baby.id, babyId), eq(baby.userId, targetUserId)))
    .limit(1);

  if (!targetBaby) throw new Error("Baby not found");

  const [allSteps, allDescriptions] = await Promise.all([
    db.select().from(step).where(eq(step.babyId, babyId)).orderBy(step.date),
    db.select().from(dailyDescription).where(eq(dailyDescription.babyId, babyId)),
  ]);

  return { baby: targetBaby, steps: allSteps, descriptions: allDescriptions };
}
