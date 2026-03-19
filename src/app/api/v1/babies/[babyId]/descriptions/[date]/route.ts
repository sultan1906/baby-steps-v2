import { db } from "@/db";
import { baby, dailyDescription } from "@/db/schema";
import { getApiSession, jsonError } from "@/lib/api-utils";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/** Get daily description for a baby and date */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ babyId: string; date: string }> }
) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { babyId, date } = await params;

  // Verify ownership
  const [found] = await db
    .select()
    .from(baby)
    .where(and(eq(baby.id, babyId), eq(baby.userId, session.user.id)))
    .limit(1);
  if (!found) return jsonError("Baby not found", 404);

  const result = await db.query.dailyDescription.findFirst({
    where: and(eq(dailyDescription.babyId, babyId), eq(dailyDescription.date, date)),
  });

  return NextResponse.json(result ?? null);
}

/** Upsert daily description for a baby and date */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ babyId: string; date: string }> }
) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { babyId, date } = await params;

  // Verify ownership
  const [found] = await db
    .select()
    .from(baby)
    .where(and(eq(baby.id, babyId), eq(baby.userId, session.user.id)))
    .limit(1);
  if (!found) return jsonError("Baby not found", 404);

  const { description } = await request.json();

  await db
    .insert(dailyDescription)
    .values({ babyId, date, description })
    .onConflictDoUpdate({
      target: [dailyDescription.babyId, dailyDescription.date],
      set: { description, updatedAt: new Date() },
    });

  return NextResponse.json({ success: true });
}
