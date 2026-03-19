import { db } from "@/db";
import { user, follow } from "@/db/schema";
import { getApiSession } from "@/lib/api-utils";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

/** Get pending follow requests */
export async function GET() {
  const { session, error } = await getApiSession();
  if (error) return error;

  const requests = await db
    .select({
      id: follow.id,
      createdAt: follow.createdAt,
      followerId: follow.followerId,
      followerName: user.name,
      followerImage: user.image,
    })
    .from(follow)
    .innerJoin(user, eq(follow.followerId, user.id))
    .where(and(eq(follow.followingId, session.user.id), eq(follow.status, "pending")))
    .orderBy(desc(follow.createdAt));

  const mapped = requests.map((r) => ({
    id: r.id,
    follower: {
      id: r.followerId,
      name: r.followerName,
      image: r.followerImage ?? null,
    },
    createdAt: r.createdAt,
  }));

  return NextResponse.json(mapped);
}
