import { db } from "@/db";
import { user, follow } from "@/db/schema";
import { getApiSession } from "@/lib/api-utils";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

/** Get all followers */
export async function GET() {
  const { session, error } = await getApiSession();
  if (error) return error;

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

  const mapped = followers.map((f) => ({
    ...f,
    image: f.image ?? null,
  }));

  return NextResponse.json(mapped);
}
