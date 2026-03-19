import { db } from "@/db";
import { step, baby, dailyDescription } from "@/db/schema";
import { getApiSession, jsonError } from "@/lib/api-utils";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/** Get all steps and descriptions for a baby */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ babyId: string }> }
) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { babyId } = await params;

  // Verify ownership
  const [found] = await db
    .select()
    .from(baby)
    .where(and(eq(baby.id, babyId), eq(baby.userId, session.user.id)))
    .limit(1);

  if (!found) return jsonError("Baby not found", 404);

  const [allSteps, allDescriptions] = await Promise.all([
    db
      .select()
      .from(step)
      .where(eq(step.babyId, babyId))
      .orderBy(step.date, step.createdAt),
    db.select().from(dailyDescription).where(eq(dailyDescription.babyId, babyId)),
  ]);

  return NextResponse.json({ steps: allSteps, descriptions: allDescriptions });
}

/** Create a single step */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ babyId: string }> }
) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { babyId } = await params;

  // Verify ownership
  const [found] = await db
    .select()
    .from(baby)
    .where(and(eq(baby.id, babyId), eq(baby.userId, session.user.id)))
    .limit(1);

  if (!found) return jsonError("Baby not found", 404);

  const data = await request.json();
  const [s] = await db.insert(step).values({ ...data, babyId }).returning();

  return NextResponse.json(s, { status: 201 });
}
