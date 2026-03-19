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
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return jsonError("Invalid request body");
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (data.name !== undefined) {
    if (typeof data.name !== "string") return jsonError("name must be a string");
    const trimmed = data.name.trim();
    if (!trimmed || trimmed.length > 100) return jsonError("Invalid name");
    updates.name = trimmed;
  }
  if (data.image !== undefined) {
    if (data.image !== null && typeof data.image !== "string")
      return jsonError("image must be a string or null");
    updates.image = data.image || null;
  }
  if (data.bio !== undefined) {
    if (typeof data.bio !== "string") return jsonError("bio must be a string");
    updates.bio = data.bio.trim().slice(0, 160) || null;
  }
  if (data.location !== undefined) {
    if (typeof data.location !== "string") return jsonError("location must be a string");
    updates.location = data.location.trim().slice(0, 100) || null;
  }

  await db.update(user).set(updates).where(eq(user.id, session.user.id));

  return NextResponse.json({ success: true });
}
