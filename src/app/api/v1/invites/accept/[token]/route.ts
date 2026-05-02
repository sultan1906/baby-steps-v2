import { getApiSession, jsonError } from "@/lib/api-utils";
import { acceptInvite } from "@/actions/invites";
import { NextRequest, NextResponse } from "next/server";

/** Accept an invite */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { error } = await getApiSession();
  if (error) return error;

  const { token } = await params;

  try {
    const result = await acceptInvite(token);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to accept invite";
    return jsonError(msg);
  }
}
