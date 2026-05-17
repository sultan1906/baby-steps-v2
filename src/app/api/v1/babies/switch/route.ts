import { db } from "@/db";
import { baby } from "@/db/schema";
import { getApiSession, jsonError } from "@/lib/api-utils";
import { currentBabyCookieConfig } from "@/lib/baby-utils";
import { hasBabyAccess } from "@/lib/baby-access";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/** Switch the active baby (owner or co-parent) */
export async function POST(request: NextRequest) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { babyId } = await request.json();
  if (!babyId) return jsonError("babyId is required");

  const allowed = await hasBabyAccess(babyId, session.user.id);
  if (!allowed) return jsonError("Baby not found", 404);

  const [found] = await db.select().from(baby).where(eq(baby.id, babyId)).limit(1);
  if (!found) return jsonError("Baby not found", 404);

  const cookieStore = await cookies();
  const { name, value, options } = currentBabyCookieConfig(babyId);
  cookieStore.set(name, value, options);

  return NextResponse.json(found);
}
