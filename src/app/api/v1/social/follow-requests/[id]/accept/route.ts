import { db } from "@/db";
import { follow } from "@/db/schema";
import { getApiSession } from "@/lib/api-utils";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/** Accept a follow request */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { id: followId } = await params;
  await db
    .update(follow)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(
      and(eq(follow.id, followId), eq(follow.followingId, session.user.id), eq(follow.status, "pending"))
    );

  return NextResponse.json({ success: true });
}
