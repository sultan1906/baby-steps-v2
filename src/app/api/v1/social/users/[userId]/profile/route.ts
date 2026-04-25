import { db } from "@/db";
import { user, follow, baby } from "@/db/schema";
import { getApiSession } from "@/lib/api-utils";
import { eq, and, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/** Get a user's public profile */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { userId: targetUserId } = await params;

  const [targetUser] = await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      bio: user.bio,
      location: user.location,
      isPublic: user.isPublic,
    })
    .from(user)
    .where(eq(user.id, targetUserId))
    .limit(1);

  if (!targetUser) return NextResponse.json(null, { status: 404 });

  // Follow status
  const [followRow] = await db
    .select({ status: follow.status })
    .from(follow)
    .where(and(eq(follow.followerId, session.user.id), eq(follow.followingId, targetUserId)))
    .limit(1);

  const followStatus =
    followRow?.status === "accepted"
      ? "accepted"
      : followRow?.status === "pending"
        ? "pending"
        : "none";

  // Babies (only if following or public)
  let babies: { id: string; name: string; photoUrl: string | null; birthdate: string }[] = [];
  if (followStatus === "accepted" || targetUser.isPublic) {
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

  return NextResponse.json({
    id: targetUser.id,
    name: targetUser.name,
    image: targetUser.image ?? null,
    bio: targetUser.bio ?? null,
    location: targetUser.location ?? null,
    isPublic: targetUser.isPublic,
    followStatus,
    babies,
  });
}
