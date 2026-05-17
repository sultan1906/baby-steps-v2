import { db } from "@/db";
import { baby } from "@/db/schema";
import { getApiSession, jsonError } from "@/lib/api-utils";
import { sqlBabyWritable } from "@/lib/baby-access";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/** Update a baby (owner or co-parent) */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ babyId: string }> }
) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const [{ babyId }, data] = await Promise.all([params, request.json()]);

  const allowedFields = {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.birthdate !== undefined && { birthdate: data.birthdate }),
    ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
  };

  if (Object.keys(allowedFields).length === 0) {
    return jsonError("No fields to update", 400);
  }

  const [updated] = await db
    .update(baby)
    .set(allowedFields)
    .where(and(eq(baby.id, babyId), sqlBabyWritable(baby.id, session.user.id)))
    .returning();

  if (!updated) return jsonError("Baby not found", 404);

  return NextResponse.json(updated);
}

/** Delete a baby (owner only) */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ babyId: string }> }
) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { babyId } = await params;

  const deleted = await db
    .delete(baby)
    .where(and(eq(baby.id, babyId), eq(baby.userId, session.user.id)))
    .returning({ id: baby.id });
  if (deleted.length === 0) return jsonError("Baby not found", 404);

  const cookieStore = await cookies();
  cookieStore.delete("babysteps_current_baby");

  return NextResponse.json({ success: true });
}
