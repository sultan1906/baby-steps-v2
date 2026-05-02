import { acceptInvite } from "@/actions/invites";
import { readPendingInviteCookie, clearPendingInviteCookie } from "@/lib/invite-cookie";

/**
 * If a pending_invite_token cookie is present, try to redeem it.
 * Returns a destination path the caller should redirect to, or null if no redirect needed.
 *
 * Must be invoked from a server component / action context (uses cookies()).
 */
export async function consumePendingInvite(): Promise<string | null> {
  const token = await readPendingInviteCookie();
  if (!token) return null;

  try {
    const { inviterId } = await acceptInvite(token);
    await clearPendingInviteCookie();
    return `/profile/${inviterId}?welcome=1`;
  } catch {
    // Invalid/expired/mismatched — drop the cookie and surface a soft error.
    await clearPendingInviteCookie();
    return `/timeline?invite=invalid`;
  }
}
