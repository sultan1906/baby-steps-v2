import { db } from "@/db";
import { savedLocation } from "@/db/schema";
import { getApiSession, jsonError } from "@/lib/api-utils";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/** Get saved locations */
export async function GET() {
  const { session, error } = await getApiSession();
  if (error) return error;

  const locations = await db
    .select()
    .from(savedLocation)
    .where(eq(savedLocation.userId, session.user.id))
    .orderBy(desc(savedLocation.createdAt));

  return NextResponse.json(locations);
}

/** Create a saved location */
export async function POST(request: NextRequest) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const data = await request.json();
  if (!data.nickname || !data.address) {
    return jsonError("nickname and address are required");
  }

  const [loc] = await db
    .insert(savedLocation)
    .values({ ...data, userId: session.user.id })
    .returning();

  return NextResponse.json(loc, { status: 201 });
}
