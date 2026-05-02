import { cookies } from "next/headers";

export const INVITE_COOKIE_NAME = "pending_invite_token";
export const INVITE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;

export async function readPendingInviteCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(INVITE_COOKIE_NAME)?.value ?? null;
}

export async function clearPendingInviteCookie() {
  const jar = await cookies();
  jar.delete(INVITE_COOKIE_NAME);
}
