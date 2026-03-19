import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Get the current session from the request headers.
 * Returns the session or a 401 JSON response.
 */
export async function getApiSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

/**
 * Wrap an async handler to catch errors and return JSON responses.
 */
export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
