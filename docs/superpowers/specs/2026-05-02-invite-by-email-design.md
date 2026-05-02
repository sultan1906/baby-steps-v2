# Invite-by-Email Connections — Design

**Date:** 2026-05-02
**Status:** Approved, ready for implementation plan
**Branch:** `shachars-droid/invite-by-email`

## Goal

Replace the current "search any user → request to follow" flow with an invite-based flow:

1. The only way to connect with another user is through a personal invite (email or copyable link).
2. When the invitee accepts, the two users are **mutually auto-followed** (both directions, status `accepted`).
3. The existing in-app search becomes "search within users I already follow" — you cannot discover new users by searching.

## Why

Privacy & intentionality. The product is a baby memory journal. Users should explicitly grant access to specific people (family, close friends), not have their name be searchable by strangers. Mutual follow on accept matches the social model of a family album: when grandma accepts your invite, you both see each other's content immediately, no extra steps.

## Out of Scope

- Push or SMS notifications.
- Per-baby invite scoping (invitee sees all of inviter's babies).
- Bulk invite (one email at a time).
- Audit log of who redeemed which reusable link.
- Analytics/tracking.
- Net-new automated test harness — repo has none today; manual smoke tests are documented below.
- Backfill / cleanup of any existing `pending` follow rows from the old flow (handled manually via SQL if needed).

---

## 1. Data Model

### New table: `invite`

```ts
export const inviteKindEnum = pgEnum("invite_kind", ["email", "link"]);
export const inviteStatusEnum = pgEnum("invite_status",
  ["pending", "accepted", "revoked", "expired"]);

export const invite = pgTable("invite", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  kind: inviteKindEnum("kind").notNull(),
  email: text("email"),                    // lowercased; required when kind='email'
  token: text("token").notNull().unique(), // 32-byte base64url random
  status: inviteStatusEnum("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at").notNull(),         // createdAt + 1 day
  acceptedByUserId: text("accepted_by_user_id")
    .references(() => user.id, { onDelete: "set null" }),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  inviterIdx: index("invite_inviter_idx").on(t.inviterId, t.status),
  emailIdx: index("invite_email_idx").on(t.email),
  tokenIdx: index("invite_token_idx").on(t.token),
  uniquePendingEmailPerInviter: uniqueIndex("invite_unique_pending_email")
    .on(t.inviterId, t.email)
    .where(sql`${t.status} = 'pending' AND ${t.kind} = 'email'`),
  emailRequiredForKind: check("invite_email_kind_check",
    sql`(${t.kind} = 'email' AND ${t.email} IS NOT NULL)
        OR (${t.kind} = 'link' AND ${t.email} IS NULL)`),
}));
```

### Existing `follow` table

Unchanged. The `follow_status` enum keeps `pending|accepted|rejected` for backwards compatibility with any legacy rows, but **all new rows created by the invite flow are `accepted`**. We never insert `pending` follow rows anywhere going forward.

### Token

Generated server-side: `crypto.randomBytes(32).toString("base64url")`. ~256 bits of entropy. Never logged. Lookups happen by token, not by id, so the URL itself is the bearer credential for unauthenticated preview.

### Migration

A single new Drizzle migration that:
1. Creates the two enums.
2. Creates the `invite` table with indexes and check constraint.

No data backfill. No changes to `follow`.

---

## 2. Server Actions

New file: `src/actions/invites.ts`.

### Inviter actions

```ts
createEmailInvite(email: string)
  → Validates: email format, lowercase, not equal to caller's email,
    target user (if exists) is not already mutually followed by caller.
    If a pending non-expired email-invite from caller to this email already exists,
    re-send the email and return that invite (no duplicate row).
    Otherwise: insert invite row, send Resend email with link.
    Returns { inviteId, status: "sent" | "resent" }.

createLinkInvite()
  → Inserts kind='link' invite (email = null). Returns { inviteId, url }.

revokeInvite(inviteId: string)
  → Updates status to 'revoked' WHERE id = $1 AND inviter_id = caller AND status = 'pending'.
    No-op if already non-pending.

listMyInvites()
  → Returns inviter's pending invites (active + expired-but-still-pending),
    sorted by createdAt desc. Used by the Invite tab.
```

### Recipient actions

```ts
getInvitePreview(token: string)
  → Public (no session required). Returns:
    {
      status: "valid" | "expired" | "revoked" | "accepted" | "not_found",
      inviter?: { id, name, image },
      babies?: Array<{ id, name, photoUrl, birthdate }>, // first 3
      kind?: "email" | "link",
    }
    Never returns invite.email (would leak invitee email to anyone with the link).

acceptInvite(token: string)
  → Requires session. Validates:
    - status='pending' AND expiresAt > now()
    - if kind='email': signed-in user's emailVerified === true
      AND signedInUser.email.toLowerCase() === invite.email
    - inviter !== signed-in user
    Single transaction:
      1. For kind='email': update invite SET status='accepted',
         acceptedByUserId=session.userId, acceptedAt=now() WHERE status='pending'.
         If 0 rows updated → throw "already accepted or revoked".
      2. For kind='link': do not mutate the invite row (stays pending, reusable).
      3. Upsert follow rows (both directions) with ON CONFLICT (follower_id, following_id)
         DO UPDATE SET status = 'accepted', updatedAt = now().
    revalidatePath('/following'), revalidatePath('/timeline').
    Returns { inviterId }.
```

### Replaced/removed from `src/actions/social.ts`

| Old | New |
|---|---|
| `searchUsers(q)` | **removed** — Following tab does in-memory filter on the already-loaded list; no server action needed |
| `sendFollowRequest(userId)` | **removed** |
| `acceptFollowRequest(followId)` | **removed** |
| `rejectFollowRequest(followId)` | **removed** |
| `getFollowRequests()` | **removed** |
| `getPendingRequestCount()` | replaced by `getPendingIncomingInviteCount()` (counts pending email-invites where `email = signedInUser.email` and not expired) |

`getFollowedUsers`, `getFollowers`, `getUserProfile`, `getFollowedUserTimeline`, `unfollowUser`, `removeFollower`, `getParentProfile`, `updateParentProfile` are unchanged.

---

## 3. REST API

New routes under `src/app/api/v1/invites/`:

| Verb | Path | Body / Params | Purpose |
|---|---|---|---|
| POST | `/api/v1/invites` | `{ email?: string }` (no email → link kind) | Create invite |
| GET | `/api/v1/invites` | — | List my pending invites |
| DELETE | `/api/v1/invites/:id` | — | Revoke |
| GET | `/api/v1/invites/preview/:token` | — | Public preview (no auth required) |
| POST | `/api/v1/invites/accept/:token` | — | Accept invite (auth required) |

Routes under `src/app/api/v1/social/` to **delete**:
- `follow/[userId]/route.ts`
- `follow-requests/route.ts`
- `follow-requests/[id]/accept/route.ts`
- `follow-requests/[id]/reject/route.ts`
- `search/route.ts`

Routes that **stay** (`profile`, `timeline`, `followers`, `followed-users`) — unchanged.

---

## 4. Email Template

New file: `src/emails/InviteEmailTemplate.tsx`. Styled to match `VerifyEmailTemplate` and `ResetPasswordTemplate`:

- Footprint emoji header (👣)
- Heading: `<inviter name> invited you to Baby Steps`
- Body: `<inviter name> wants to share <baby name(s)>'s journey with you.` (Falls back to `their baby's journey` if inviter has no babies — though they probably do.)
- CTA button: "Accept invite" → `${NEXT_PUBLIC_APP_URL}/invite/<token>`
- Expiry note: "This invite expires in 24 hours."

Sent from `process.env.RESEND_FROM_EMAIL`, subject `"<inviter name> invited you to Baby Steps"`.

---

## 5. UI

### `/following` tabs

Replace today's four tabs (Search, Following, Followers, Requests) with **three**:

1. **Invite** (new — replaces Search)
2. **Following** (existing — adds an in-memory name filter input at the top)
3. **Followers** (existing — unchanged)

The **Requests** tab is removed entirely. With mutual auto-follow on accept, there is no in-app approval step — recipients accept invites through the email link or copyable URL. The bottom nav badge still surfaces a count of pending email-invites addressed to the signed-in user's email so they know to check their email; tapping the badge takes them to the Invite tab where a future enhancement could show received invites, but for v1 there is no in-app inbox.

### Invite tab body

`src/components/social/invite-tab.tsx` — three sections stacked:

**A. "Invite by email" form**
- Email text input + "Send" button.
- Inline validation: email format, not self.
- On success: toast "Invite sent to alice@example.com" or "Invite resent".
- On Resend failure: toast "Couldn't send email — link copied to clipboard instead" + automatically copies the invite URL.

**B. "Or share a link" card**
- Single button: "Copy invite link". On first press creates a `kind='link'` invite, copies URL to clipboard, shows checkmark animation. Subsequent presses copy the same active link until it's revoked or expires (we look up the user's most recent pending link invite and reuse it).
- Small "Revoke" link below if an active link invite exists.

**C. "Pending invites" list** (`invite-list-row.tsx` per row)
- Each row: email or 🔗 chip (for link invites), expires-in countdown ("Expires in 18h" / "Expired"), Revoke button.
- Empty state: "No pending invites".

### New route `src/app/invite/[token]/page.tsx`

Server component, **outside** the `(app)` group so it's reachable signed-out. Uses the same minimal shell as `/auth`.

Logic:
1. Call `getInvitePreview(token)`. Render based on status:
   - `not_found` / `revoked` / `expired` / `accepted` (for email-kind): friendly error page.
   - `valid`: show inviter card (avatar, name) + babies preview row + Accept CTA.
2. If signed in:
   - Accept button → `acceptInvite(token)` → `router.push("/profile/<inviterId>?welcome=1")`.
   - On error (mismatched email-bound invite): "This invite was sent to <masked email>. Sign in with that account." + sign-out link.
   - Self-acceptance: redirect to `/following` with toast "That's your own invite link."
3. If signed out:
   - Set HTTP-only cookie `pending_invite_token = <token>` (path `/`, Secure, SameSite=Lax, max-age 24h).
   - Show "Sign up" / "Sign in" buttons that route to `/auth` with `?invite=<token>` (so the auth page can pre-fill the email when invite kind is 'email' — fetched again via preview if needed).

### Auth & redemption

- The signup page reads the `invite` query param. For email-kind invites, the email field is pre-filled and read-only.
- After successful sign-up + email verification (better-auth's `autoSignInAfterVerification` is already enabled), the user lands on the post-auth landing route.
- After successful sign-in, same thing.
- The `(app)` server layout (`src/app/(app)/layout.tsx`) is the central redemption hook — it runs on every request inside the app, after the session is loaded and before any page renders:
  - If `pending_invite_token` cookie present, call `acceptInvite(token)`.
  - On success: clear cookie, redirect to `/profile/<inviterId>?welcome=1`.
  - On failure (expired/revoked/mismatch): clear cookie, redirect to `/timeline?invite=invalid` (toast surfaces the error).
  - Skipped on `/profile/...` to avoid a redirect loop after we've already sent the user there.
- Per Q7 of brainstorming: this overrides the default destination **even for new signups**. They can complete onboarding from the bottom nav whenever they want.

The `?welcome=1` query on `/profile/<inviterId>` triggers a one-time toast: "You're now connected with <inviter name>".

### Updated components

- `following-client.tsx`: drop Search and Requests tabs and their state. Add `<InviteTab>`. Add a small name-filter input at the top of the Following list (in-memory `.filter()` on the existing array).
- `follow-button.tsx`: kept for the unfollow case on `/profile/[userId]` and on `FollowedUserCard`. Never renders for `status === "none"` since you can't initiate a follow without an invite. Profile page shows "This profile is private" + nothing else when `followStatus === "none"`.
- `user-search.tsx`: **deleted**.
- `follow-request-card.tsx`: **deleted**.
- Bottom nav badge on the People tab: replaced — counts pending email-invites where `email = signedInUser.email` AND not expired.

---

## 6. Edge Cases & Error Handling

| Scenario | Where | Message |
|---|---|---|
| Invalid email format | Invite form, inline | "Enter a valid email address" |
| Self-invite | Invite form, inline | "You can't invite yourself" |
| Already mutually connected | Invite form, toast | "You're already connected with this person" |
| Pending invite to same email exists | Invite form, toast | "Invite resent" (re-send email, no new row) |
| Expired link | Preview page | "This invite has expired. Ask <inviter> for a new one." |
| Revoked link | Preview page | "This invite is no longer valid." |
| Email-bound mismatch | Preview page after auth | "This invite was sent to <masked email>. Sign in with that account." |
| Resend API failure | Invite form, toast | "Couldn't send email. Link copied to clipboard instead." (still creates row, copies URL) |
| Inviter deleted account | Preview page | "This invite is no longer available." (cascade-delete makes invite row vanish, so really `not_found`) |
| Self-acceptance | Preview accept handler | Redirect to `/following`, toast "That's your own invite link." |

### Concurrency

- Two recipients accept the same email-bound invite simultaneously: the `WHERE status = 'pending'` clause on the UPDATE arbitrates. The losing call sees 0 rows updated → throws "already accepted".
- Recipient accepts while inviter revokes: same WHERE clause arbitrates.
- Duplicate `(followerId, followingId)` follow row from any prior state: handled by `ON CONFLICT (follower_id, following_id) DO UPDATE SET status = 'accepted', updatedAt = now()`.

### Privacy

- `getInvitePreview` is the only public-readable endpoint. It returns inviter name/image and babies' names/photos/birthdates only. No timeline content. No `email`. No other inviter metadata (bio, location).
- All emails stored lowercased (canonical form) so dedup and re-invite checks work regardless of input casing.
- Token never logged. Treat the URL as the secret.

---

## 7. Manual Smoke Tests

The repo has no automated test harness. These 12 scenarios should pass before merging:

1. **Send email invite** to a new email → email arrives, link works, accepting creates mutual follow.
2. **Send email invite** to an existing user's verified email → they accept while signed in → mutual follow.
3. **Email-bound mismatch** → wrong account signed in, accept blocked, friendly error.
4. **Generate copy link** → paste in incognito → preview shows → sign up → auto-redeem post-verification.
5. **Reusable link** — second different user redeems the same link → also gets connected; invite stays pending.
6. **Self-invite** by typing own email → blocked inline.
7. **Already connected** → invite form shows toast; no row created.
8. **Re-invite same email** within 24h → "Invite resent"; only one row in DB.
9. **Revoke pending invite** → invite list updates; clicking the link afterwards shows "no longer valid".
10. **Expired invite** (manually set `expires_at` to the past) → preview page shows expired error.
11. **Search Following tab** by name → filters in-memory list correctly.
12. **Following someone, then viewing their profile** → babies visible; unfollow still works.

---

## 8. File Inventory

### Create
- `src/db/schema.ts` — add invite table + enums + relations (edit existing file)
- `drizzle/migrations/000X_invite.sql` — generated by `drizzle-kit`
- `src/actions/invites.ts`
- `src/app/api/v1/invites/route.ts`
- `src/app/api/v1/invites/[id]/route.ts`
- `src/app/api/v1/invites/preview/[token]/route.ts`
- `src/app/api/v1/invites/accept/[token]/route.ts`
- `src/app/invite/[token]/page.tsx`
- `src/app/invite/[token]/invite-accept-client.tsx`
- `src/components/social/invite-tab.tsx`
- `src/components/social/invite-list-row.tsx`
- `src/components/social/copy-invite-link-button.tsx`
- `src/emails/InviteEmailTemplate.tsx`
- `src/lib/invite-cookie.ts` — helpers to read/set/clear `pending_invite_token`
- `src/lib/post-auth-invite.ts` — invoked from the `(app)` server layout

### Modify
- `src/types/index.ts` — add `Invite`, `InvitePreview`, etc.
- `src/actions/social.ts` — remove search/follow-request actions; add `getPendingIncomingInviteCount`
- `src/app/(app)/following/following-client.tsx` — drop Search/Requests tabs, add Invite tab + Following filter
- `src/app/(app)/following/page.tsx` — drop `getFollowRequests` call
- `src/app/(app)/layout.tsx` — central post-auth invite redemption hook (reads `pending_invite_token` cookie, calls `acceptInvite`, redirects to `/profile/<inviterId>?welcome=1` or `/timeline?invite=invalid`); also swaps `getPendingRequestCount` for `getPendingIncomingInviteCount`
- `src/app/(app)/profile/[userId]/profile-client.tsx` — surface `?welcome=1` toast; hide Follow button for `none` status
- `src/components/social/follow-button.tsx` — remove `status === "none"` branch (or render nothing)
- Bottom nav (find file in `src/components/`) — swap pending-request count for pending-incoming-invite count

### Delete
- `src/components/social/user-search.tsx`
- `src/components/social/follow-request-card.tsx`
- `src/app/api/v1/social/search/route.ts`
- `src/app/api/v1/social/follow/[userId]/route.ts`
- `src/app/api/v1/social/follow-requests/route.ts`
- `src/app/api/v1/social/follow-requests/[id]/accept/route.ts`
- `src/app/api/v1/social/follow-requests/[id]/reject/route.ts`

---

## 9. Pre-Push Checklist

Per user preferences, before any push:
- [ ] `npm run lint`
- [ ] `npm run knip`
- [ ] `npm run format:check`
- [ ] Manual smoke tests (Section 7) pass on local dev
- [ ] Confirm with user before pushing
