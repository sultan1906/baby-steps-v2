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
    db.select().from(step).where(eq(step.babyId, babyId)).orderBy(step.date, step.createdAt),
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

  const allowedFields = {
    babyId,
    date: data.date,
    type: data.type,
    ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
    ...(data.locationId !== undefined && { locationId: data.locationId }),
    ...(data.locationNickname !== undefined && { locationNickname: data.locationNickname }),
    ...(data.isMajor !== undefined && { isMajor: data.isMajor }),
    ...(data.weight !== undefined && { weight: data.weight }),
    ...(data.height !== undefined && { height: data.height }),
    ...(data.firstWord !== undefined && { firstWord: data.firstWord }),
    ...(data.title !== undefined && { title: data.title }),
    ...(data.caption !== undefined && { caption: data.caption }),
  };

  const [s] = await db
    .insert(step)
    .values(allowedFields)
    .returning();

  return NextResponse.json(s, { status: 201 });
}
