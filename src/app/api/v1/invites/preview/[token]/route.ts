import { getInvitePreview } from "@/actions/invites";
import { NextRequest, NextResponse } from "next/server";

/** Public invite preview — no auth required */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const preview = await getInvitePreview(token);
  return NextResponse.json(preview);
}
