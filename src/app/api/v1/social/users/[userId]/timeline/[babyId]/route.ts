import { db } from "@/db";
import { follow, baby, step, dailyDescription } from "@/db/schema";
import { getApiSession, jsonError } from "@/lib/api-utils";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/** Get a followed user's baby timeline */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string; babyId: string }> }
) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { userId: targetUserId, babyId } = await params;

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

  if (!followRow) return jsonError("Not authorized to view this user's content", 403);

  // Verify baby belongs to target user
  const [targetBaby] = await db
    .select()
    .from(baby)
    .where(and(eq(baby.id, babyId), eq(baby.userId, targetUserId)))
    .limit(1);

  if (!targetBaby) return jsonError("Baby not found", 404);

  const [allSteps, allDescriptions] = await Promise.all([
    db.select().from(step).where(eq(step.babyId, babyId)).orderBy(step.date, step.createdAt),
    db.select().from(dailyDescription).where(eq(dailyDescription.babyId, babyId)),
  ]);

  return NextResponse.json({ baby: targetBaby, steps: allSteps, descriptions: allDescriptions });
}
