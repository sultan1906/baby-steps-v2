import { cookies } from "next/headers";

export const COPARENT_INVITE_COOKIE_NAME = "pending_coparent_invite_token";
export const COPARENT_INVITE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;

export async function readPendingCoParentInviteCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COPARENT_INVITE_COOKIE_NAME)?.value ?? null;
}

export async function clearPendingCoParentInviteCookie() {
  const jar = await cookies();
  jar.delete(COPARENT_INVITE_COOKIE_NAME);
}
