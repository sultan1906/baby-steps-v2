import { db } from "@/db";
import { step } from "@/db/schema";
import { getApiSession, jsonError } from "@/lib/api-utils";
import { sqlBabyWritable } from "@/lib/baby-access";
import { and, eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

/** Update a step (owner or co-parent of the underlying baby) */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const [{ id: stepId }, data] = await Promise.all([params, request.json()]);

  const allowedFields: Record<string, unknown> = {};
  if (data.date !== undefined) allowedFields.date = data.date;
  if (data.photoUrl !== undefined) allowedFields.photoUrl = data.photoUrl;
  if (data.locationId !== undefined) allowedFields.locationId = data.locationId;
  if (data.locationNickname !== undefined) allowedFields.locationNickname = data.locationNickname;
  if (data.firstWord !== undefined) allowedFields.firstWord = data.firstWord;
  if (data.title !== undefined) allowedFields.title = data.title;
  if (data.caption !== undefined) allowedFields.caption = data.caption;

  const [updated] = await db
    .update(step)
    .set(allowedFields)
    .where(and(eq(step.id, stepId), sqlBabyWritable(step.babyId, session.user.id)))
    .returning();
  if (!updated) return jsonError("Not found or unauthorized", 404);

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

  const [deleted] = await db
    .delete(step)
    .where(and(eq(step.id, stepId), sqlBabyWritable(step.babyId, session.user.id)))
    .returning({ photoUrl: step.photoUrl });
  if (!deleted) return jsonError("Not found or unauthorized", 404);

  if (deleted.photoUrl) {
    await del(deleted.photoUrl);
  }

  return NextResponse.json({ success: true });
}
