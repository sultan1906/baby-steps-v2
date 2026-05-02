import { cookies } from "next/headers";

const INVITE_COOKIE_NAME = "pending_invite_token";
const ONE_DAY_SECONDS = 60 * 60 * 24;

export async function setPendingInviteCookie(token: string) {
  const jar = await cookies();
  jar.set(INVITE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_DAY_SECONDS,
  });
}

export async function readPendingInviteCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(INVITE_COOKIE_NAME)?.value ?? null;
}

export async function clearPendingInviteCookie() {
  const jar = await cookies();
  jar.delete(INVITE_COOKIE_NAME);
}
