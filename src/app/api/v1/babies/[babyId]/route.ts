import { db } from "@/db";
import { baby } from "@/db/schema";
import { getApiSession, jsonError } from "@/lib/api-utils";
import { hasBabyAccess, isBabyOwner } from "@/lib/baby-access";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/** Update a baby (owner or co-parent) */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ babyId: string }> }
) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const [{ babyId }, data] = await Promise.all([params, request.json()]);

  const allowed = await hasBabyAccess(babyId, session.user.id);
  if (!allowed) return jsonError("Baby not found", 404);

  const allowedFields = {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.birthdate !== undefined && { birthdate: data.birthdate }),
    ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
  };

  const [updated] = await db.update(baby).set(allowedFields).where(eq(baby.id, babyId)).returning();

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

  const allowed = await isBabyOwner(babyId, session.user.id);
  if (!allowed) return jsonError("Baby not found", 404);

  await db.delete(baby).where(eq(baby.id, babyId));

  const cookieStore = await cookies();
  cookieStore.delete("babysteps_current_baby");

  return NextResponse.json({ success: true });
}
