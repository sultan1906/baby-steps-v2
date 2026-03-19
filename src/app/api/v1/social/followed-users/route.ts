import { db } from "@/db";
import { user, follow, baby } from "@/db/schema";
import { getApiSession } from "@/lib/api-utils";
import { eq, and, desc, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

/** Get all followed users with their babies */
export async function GET() {
  const { session, error } = await getApiSession();
  if (error) return error;

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

  if (accepted.length === 0) return NextResponse.json([]);

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

  const result = accepted.map((u) => ({
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

  return NextResponse.json(result);
}
