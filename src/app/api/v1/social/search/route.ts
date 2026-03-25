import { db } from "@/db";
import { user, follow } from "@/db/schema";
import { getApiSession } from "@/lib/api-utils";
import { eq, and, or, ilike, ne, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/** Search users by name or location */
export async function GET(request: NextRequest) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const searchTerm = `%${q}%`;

  const results = await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      isPublic: user.isPublic,
      bio: user.bio,
      location: user.location,
    })
    .from(user)
    .where(
      and(
        ne(user.id, session.user.id),
        or(ilike(user.name, searchTerm), ilike(user.location, searchTerm))
      )
    )
    .limit(20);

  if (results.length === 0) return NextResponse.json([]);

  // Batch-check follow status
  const resultIds = results.map((r) => r.id);
  const followRows = await db
    .select({ followingId: follow.followingId, status: follow.status })
    .from(follow)
    .where(and(eq(follow.followerId, session.user.id), inArray(follow.followingId, resultIds)));

  const followMap = new Map(followRows.map((f) => [f.followingId, f.status]));

  const mapped = results.map((r) => ({
    id: r.id,
    name: r.name,
    image: r.image ?? null,
    isPublic: r.isPublic,
    bio: r.bio ?? null,
    location: r.location ?? null,
    followStatus:
      followMap.get(r.id) === "accepted"
        ? "accepted"
        : followMap.get(r.id) === "pending"
          ? "pending"
          : "none",
  }));

  return NextResponse.json(mapped);
}
