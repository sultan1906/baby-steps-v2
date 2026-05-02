import { getApiSession, jsonError } from "@/lib/api-utils";
import { createEmailInvite, createLinkInvite, listMyInvites } from "@/actions/invites";
import { NextRequest, NextResponse } from "next/server";

/** Create an invite (email or link) */
export async function POST(request: NextRequest) {
  const { error } = await getApiSession();
  if (error) return error;

  const rawBody = await request.text();
  let body: { email?: string } = {};
  if (rawBody.trim()) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      return jsonError("Invalid JSON body");
    }
  }

  try {
    if (body.email && body.email.trim()) {
      const result = await createEmailInvite(body.email);
      return NextResponse.json(result, { status: 201 });
    }
    const result = await createLinkInvite();
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create invite";
    return jsonError(msg);
  }
}

/** List my pending invites */
export async function GET() {
  const { error } = await getApiSession();
  if (error) return error;

  try {
    const invites = await listMyInvites();
    return NextResponse.json(invites);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch invites";
    return jsonError(msg, 500);
  }
}
