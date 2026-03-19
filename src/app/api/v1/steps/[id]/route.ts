import { db } from "@/db";
import { step, baby, dailyDescription } from "@/db/schema";
import { getApiSession, jsonError } from "@/lib/api-utils";
import { eq, and, count } from "drizzle-orm";
import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

/** Update a step */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { id: stepId } = await params;
  const data = await request.json();

  const [found] = await db
    .select({ id: step.id, babyId: step.babyId, date: step.date })
    .from(step)
    .innerJoin(baby, eq(step.babyId, baby.id))
    .where(and(eq(step.id, stepId), eq(baby.userId, session.user.id)));

  if (!found) return jsonError("Not found or unauthorized", 404);

  const allowedFields: Record<string, unknown> = {};
  if (data.date !== undefined) allowedFields.date = data.date;
  if (data.photoUrl !== undefined) allowedFields.photoUrl = data.photoUrl;
  if (data.locationId !== undefined) allowedFields.locationId = data.locationId;
  if (data.locationNickname !== undefined) allowedFields.locationNickname = data.locationNickname;
  if (data.weight !== undefined) allowedFields.weight = data.weight;
  if (data.height !== undefined) allowedFields.height = data.height;
  if (data.firstWord !== undefined) allowedFields.firstWord = data.firstWord;
  if (data.title !== undefined) allowedFields.title = data.title;
  if (data.caption !== undefined) allowedFields.caption = data.caption;

  const [updated] = await db.update(step).set(allowedFields).where(eq(step.id, stepId)).returning();

  // If date changed, clean up orphaned daily description for the old date
  if (data.date && data.date !== found.date) {
    const [{ remaining }] = await db
      .select({ remaining: count() })
      .from(step)
      .where(and(eq(step.babyId, found.babyId), eq(step.date, found.date)));

    if (remaining === 0) {
      const [desc] = await db
        .select({ description: dailyDescription.description })
        .from(dailyDescription)
        .where(
          and(eq(dailyDescription.babyId, found.babyId), eq(dailyDescription.date, found.date))
        );
      if (!desc?.description) {
        await db
          .delete(dailyDescription)
          .where(
            and(eq(dailyDescription.babyId, found.babyId), eq(dailyDescription.date, found.date))
          );
      }
    }
  }

  return NextResponse.json(updated);
}

/** Delete a step */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { id: stepId } = await params;

  const [found] = await db
    .select({ id: step.id, babyId: step.babyId, date: step.date, photoUrl: step.photoUrl })
    .from(step)
    .innerJoin(baby, eq(step.babyId, baby.id))
    .where(and(eq(step.id, stepId), eq(baby.userId, session.user.id)));

  if (!found) return jsonError("Not found or unauthorized", 404);

  if (found.photoUrl) {
    await del(found.photoUrl);
  }

  await db.delete(step).where(eq(step.id, stepId));

  // Clean up orphaned daily description if no steps remain for this date
  const [{ remaining }] = await db
    .select({ remaining: count() })
    .from(step)
    .where(and(eq(step.babyId, found.babyId), eq(step.date, found.date)));

  if (remaining === 0) {
    const [desc] = await db
      .select({ description: dailyDescription.description })
      .from(dailyDescription)
      .where(and(eq(dailyDescription.babyId, found.babyId), eq(dailyDescription.date, found.date)));
    if (!desc?.description) {
      await db
        .delete(dailyDescription)
        .where(
          and(eq(dailyDescription.babyId, found.babyId), eq(dailyDescription.date, found.date))
        );
    }
  }

  return NextResponse.json({ success: true });
}
