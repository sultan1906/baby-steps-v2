import { db } from "@/db";
import { baby } from "@/db/schema";
import { getApiSession, jsonError } from "@/lib/api-utils";
import { cookies } from "next/headers";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/** Update a baby */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ babyId: string }> }
) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { babyId } = await params;
  const data = await request.json();

  const [updated] = await db
    .update(baby)
    .set(data)
    .where(and(eq(baby.id, babyId), eq(baby.userId, session.user.id)))
    .returning();

  if (!updated) return jsonError("Baby not found", 404);

  return NextResponse.json(updated);
}

/** Delete a baby */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ babyId: string }> }
) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { babyId } = await params;
  await db.delete(baby).where(and(eq(baby.id, babyId), eq(baby.userId, session.user.id)));

  const cookieStore = await cookies();
  cookieStore.delete("babysteps_current_baby");

  return NextResponse.json({ success: true });
}
