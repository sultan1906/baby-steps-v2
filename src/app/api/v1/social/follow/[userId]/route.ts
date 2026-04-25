import { db } from "@/db";
import { user, follow } from "@/db/schema";
import { getApiSession, jsonError } from "@/lib/api-utils";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/** Send a follow request */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { userId: targetUserId } = await params;
  if (targetUserId === session.user.id) return jsonError("Cannot follow yourself");

  const [target] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, targetUserId))
    .limit(1);

  if (!target) return jsonError("User not found", 404);

  const [existing] = await db
    .select()
    .from(follow)
    .where(and(eq(follow.followerId, session.user.id), eq(follow.followingId, targetUserId)))
    .limit(1);

  if (existing) {
    if (existing.status === "accepted") return jsonError("Already following");
    if (existing.status === "pending") return jsonError("Request already pending");
    if (existing.status === "rejected") {
      await db
        .update(follow)
        .set({ status: "pending", updatedAt: new Date() })
        .where(eq(follow.id, existing.id));
      return NextResponse.json({ status: "pending" });
    }
  }

  try {
    await db.insert(follow).values({
      followerId: session.user.id,
      followingId: targetUserId,
      status: "pending",
    });
  } catch (err: unknown) {
    // Postgres unique_violation (SQLSTATE 23505) — concurrent duplicate request
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "23505"
    ) {
      const [current] = await db
        .select({ status: follow.status })
        .from(follow)
        .where(and(eq(follow.followerId, session.user.id), eq(follow.followingId, targetUserId)))
        .limit(1);
      if (current) return NextResponse.json({ status: current.status });
    }
    throw err;
  }

  return NextResponse.json({ status: "pending" }, { status: 201 });
}

/** Unfollow a user */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { userId: targetUserId } = await params;
  await db
    .delete(follow)
    .where(and(eq(follow.followerId, session.user.id), eq(follow.followingId, targetUserId)));

  return NextResponse.json({ success: true });
}
