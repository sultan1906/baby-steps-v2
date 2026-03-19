import { db } from "@/db";
import { user } from "@/db/schema";
import { getApiSession } from "@/lib/api-utils";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/** Get privacy setting */
export async function GET() {
  const { session, error } = await getApiSession();
  if (error) return error;

  const [u] = await db
    .select({ isPublic: user.isPublic })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  return NextResponse.json({ isPublic: u?.isPublic ?? true });
}

/** Toggle privacy setting */
export async function PUT(request: NextRequest) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { isPublic } = await request.json();
  await db.update(user).set({ isPublic }).where(eq(user.id, session.user.id));

  return NextResponse.json({ success: true });
}
