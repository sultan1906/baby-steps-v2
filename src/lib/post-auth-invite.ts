import { acceptInvite } from "@/actions/invites";
import { acceptCoParentInvite } from "@/actions/baby-invites";
import { readPendingInviteCookie, clearPendingInviteCookie } from "@/lib/invite-cookie";
import {
  readPendingCoParentInviteCookie,
  clearPendingCoParentInviteCookie,
} from "@/lib/coparent-invite-cookie";
import { switchBaby } from "@/actions/baby";

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
    await clearPendingInviteCookie();
    return `/timeline?invite=invalid`;
  }
}

/**
 * If a pending_coparent_invite_token cookie is present, try to redeem it
 * and switch the active baby to the newly-shared one.
 */
export async function consumePendingCoParentInvite(): Promise<string | null> {
  const token = await readPendingCoParentInviteCookie();
  if (!token) return null;

  try {
    const { babyId } = await acceptCoParentInvite(token);
    await clearPendingCoParentInviteCookie();
    try {
      await switchBaby(babyId);
    } catch {
      // non-fatal
    }
    return `/timeline?coparent=joined`;
  } catch {
    await clearPendingCoParentInviteCookie();
    return `/timeline?coparent=invalid`;
  }
}
