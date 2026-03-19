import { db } from "@/db";
import { user } from "@/db/schema";
import { getApiSession, jsonError } from "@/lib/api-utils";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/** Get parent profile */
export async function GET() {
  const { session, error } = await getApiSession();
  if (error) return error;

  const [u] = await db
    .select({
      name: user.name,
      image: user.image,
      bio: user.bio,
      location: user.location,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  return NextResponse.json(u ?? { name: "", image: null, bio: null, location: null });
}

/** Update parent profile */
export async function PUT(request: NextRequest) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const data = await request.json();
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed || trimmed.length > 100) return jsonError("Invalid name");
    updates.name = trimmed;
  }
  if (data.image !== undefined) updates.image = data.image || null;
  if (data.bio !== undefined) updates.bio = data.bio.trim().slice(0, 160) || null;
  if (data.location !== undefined) updates.location = data.location.trim().slice(0, 100) || null;

  await db.update(user).set(updates).where(eq(user.id, session.user.id));

  return NextResponse.json({ success: true });
}
