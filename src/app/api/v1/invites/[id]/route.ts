import { getApiSession, jsonError } from "@/lib/api-utils";
import { revokeInvite } from "@/actions/invites";
import { NextRequest, NextResponse } from "next/server";

/** Revoke an invite */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await getApiSession();
  if (error) return error;

  const { id } = await params;

  try {
    await revokeInvite(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to revoke invite";
    return jsonError(msg);
  }
}
