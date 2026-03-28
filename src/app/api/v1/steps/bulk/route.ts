import { db } from "@/db";
import { step, baby } from "@/db/schema";
import { getApiSession, jsonError } from "@/lib/api-utils";
import { inArray, eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/** Bulk create steps */
export async function POST(request: NextRequest) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { steps: stepsData } = await request.json();
  if (!Array.isArray(stepsData) || stepsData.length === 0) {
    return jsonError("steps array is required");
  }

  // Verify ownership of all referenced babies
  const babyIds = [...new Set(stepsData.map((s: { babyId: string }) => s.babyId))];
  const ownedBabies = await db
    .select({ id: baby.id })
    .from(baby)
    .where(and(inArray(baby.id, babyIds), eq(baby.userId, session.user.id)));

  const ownedBabyIds = new Set(ownedBabies.map((b) => b.id));
  if (babyIds.some((id) => !ownedBabyIds.has(id))) {
    return jsonError("Unauthorized babyId(s) in request", 403);
  }

  // Whitelist allowed fields for each step
  const sanitized = stepsData.map(
    (s: Record<string, string | boolean | number | null | undefined>) => ({
      babyId: s.babyId as string,
      date: s.date as string,
      type: s.type as string,
      ...(s.photoUrl !== undefined && { photoUrl: s.photoUrl as string }),
      ...(s.locationId !== undefined && { locationId: s.locationId as string }),
      ...(s.locationNickname !== undefined && { locationNickname: s.locationNickname as string }),
      ...(s.isMajor !== undefined && { isMajor: s.isMajor as boolean }),
      ...(s.firstWord !== undefined && { firstWord: s.firstWord as string }),
      ...(s.title !== undefined && { title: s.title as string }),
      ...(s.caption !== undefined && { caption: s.caption as string }),
    })
  );

  const created = await db
    .insert(step)
    .values(sanitized as (typeof step.$inferInsert)[])
    .returning();

  return NextResponse.json(created, { status: 201 });
}
