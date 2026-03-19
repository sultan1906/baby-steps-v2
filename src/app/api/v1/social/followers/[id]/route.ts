import { db } from "@/db";
import { follow } from "@/db/schema";
import { getApiSession } from "@/lib/api-utils";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/** Remove a follower */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getApiSession();
  if (error) return error;

  const { id: followId } = await params;
  await db
    .delete(follow)
    .where(and(eq(follow.id, followId), eq(follow.followingId, session.user.id)));

  return NextResponse.json({ success: true });
}
