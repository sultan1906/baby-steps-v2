"use server";

import { db } from "@/db";
import { invite, follow, user, baby } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getResend } from "@/lib/resend";
import { InviteEmailTemplate } from "@/emails/InviteEmailTemplate";
import { render } from "@react-email/components";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, and, or, gt, lte, desc, sql } from "drizzle-orm";
import crypto from "node:crypto";
import type { InvitePreview, PendingInviteItem } from "@/types";

const ONE_DAY_MS = 1000 * 60 * 60 * 24;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

function generateToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function buildInviteUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }
  return `${base}/invite/${token}`;
}

async function isMutuallyFollowing(callerId: string, otherUserId: string) {
  const rows = await db
    .select({ id: follow.id })
    .from(follow)
    .where(
      and(
        or(
          and(eq(follow.followerId, callerId), eq(follow.followingId, otherUserId)),
          and(eq(follow.followerId, otherUserId), eq(follow.followingId, callerId))
        ),
        eq(follow.status, "accepted")
      )
    );
  return rows.length >= 2;
}

async function sendInviteEmail(args: {
  to: string;
  inviterName: string;
  inviteUrl: string;
  babyNames: string[];
}) {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    throw new Error("Email is not configured (RESEND_FROM_EMAIL missing)");
  }

  const html = await render(
    InviteEmailTemplate({
      inviterName: args.inviterName,
      inviteUrl: args.inviteUrl,
      babyNames: args.babyNames,
    })
  );

  // Resend's SDK returns { data, error } instead of throwing on API rejections,
  // so we have to inspect the response or the email silently never sends.
  const { error } = await getResend().emails.send({
    from,
    to: args.to,
    subject: `${args.inviterName} invited you to Baby Steps`,
    html,
  });

  if (error) {
    console.error("Resend invite email failed", { to: args.to, error });
    throw new Error(error.message || "Couldn't send invite email");
  }
}

// ── Inviter actions ────────────────────────────────────────────────────────

export async function createEmailInvite(
  emailRaw: string
): Promise<{ inviteId: string; status: "sent" | "resent" }> {
  const session = await getSession();
  const email = emailRaw.trim().toLowerCase();

  if (!EMAIL_REGEX.test(email)) throw new Error("Enter a valid email address");
  if (email === session.user.email.toLowerCase()) throw new Error("You can't invite yourself");

  // Already mutually connected?
  const [existingUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(sql`lower(${user.email})`, email))
    .limit(1);

  if (existingUser && (await isMutuallyFollowing(session.user.id, existingUser.id))) {
    throw new Error("You're already connected with this person");
  }

  const now = new Date();

  // Expire any stale pending rows for the same (inviter, email) so a fresh
  // insert won't collide with the partial unique index.
  await db
    .update(invite)
    .set({ status: "expired" })
    .where(
      and(
        eq(invite.inviterId, session.user.id),
        eq(invite.email, email),
        eq(invite.kind, "email"),
        eq(invite.status, "pending"),
        lte(invite.expiresAt, now)
      )
    );

  // Reuse a still-active pending invite if one exists.
  const [existingPending] = await db
    .select()
    .from(invite)
    .where(
      and(
        eq(invite.inviterId, session.user.id),
        eq(invite.email, email),
        eq(invite.kind, "email"),
        eq(invite.status, "pending"),
        gt(invite.expiresAt, now)
      )
    )
    .limit(1);

  // Inviter info for email
  const [inviterRow] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
  const inviterName = inviterRow?.name ?? "A friend";

  const babiesRows = await db
    .select({ name: baby.name })
    .from(baby)
    .where(eq(baby.userId, session.user.id))
    .orderBy(desc(baby.createdAt));
  const babyNames = babiesRows.map((b) => b.name);

  if (existingPending) {
    // Refresh expiry so the email's "expires in 24h" claim is honest.
    const refreshedExpiresAt = new Date(now.getTime() + ONE_DAY_MS);
    await db
      .update(invite)
      .set({ expiresAt: refreshedExpiresAt })
      .where(eq(invite.id, existingPending.id));

    await sendInviteEmail({
      to: email,
      inviterName,
      inviteUrl: buildInviteUrl(existingPending.token),
      babyNames,
    });
    revalidatePath("/following");
    return { inviteId: existingPending.id, status: "resent" };
  }

  const token = generateToken();
  const expiresAt = new Date(now.getTime() + ONE_DAY_MS);

  const [inserted] = await db
    .insert(invite)
    .values({
      inviterId: session.user.id,
      kind: "email",
      email,
      token,
      status: "pending",
      expiresAt,
    })
    .returning({ id: invite.id, token: invite.token });

  await sendInviteEmail({
    to: email,
    inviterName,
    inviteUrl: buildInviteUrl(inserted.token),
    babyNames,
  });

  revalidatePath("/following");
  return { inviteId: inserted.id, status: "sent" };
}

export async function createLinkInvite(): Promise<{ inviteId: string; url: string }> {
  const session = await getSession();
  const now = new Date();

  // Reuse most recent active link invite if it exists
  const [existing] = await db
    .select()
    .from(invite)
    .where(
      and(
        eq(invite.inviterId, session.user.id),
        eq(invite.kind, "link"),
        eq(invite.status, "pending"),
        gt(invite.expiresAt, now)
      )
    )
    .orderBy(desc(invite.createdAt))
    .limit(1);

  if (existing) {
    return { inviteId: existing.id, url: buildInviteUrl(existing.token) };
  }

  const token = generateToken();
  const expiresAt = new Date(now.getTime() + ONE_DAY_MS);

  const [inserted] = await db
    .insert(invite)
    .values({
      inviterId: session.user.id,
      kind: "link",
      email: null,
      token,
      status: "pending",
      expiresAt,
    })
    .returning({ id: invite.id, token: invite.token });

  revalidatePath("/following");
  return { inviteId: inserted.id, url: buildInviteUrl(inserted.token) };
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const session = await getSession();

  await db
    .update(invite)
    .set({ status: "revoked" })
    .where(
      and(
        eq(invite.id, inviteId),
        eq(invite.inviterId, session.user.id),
        eq(invite.status, "pending")
      )
    );

  revalidatePath("/following");
}

export async function listMyInvites(): Promise<PendingInviteItem[]> {
  const session = await getSession();

  const rows = await db
    .select()
    .from(invite)
    .where(and(eq(invite.inviterId, session.user.id), eq(invite.status, "pending")))
    .orderBy(desc(invite.createdAt));

  const now = new Date();

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    email: r.email,
    expiresAt: r.expiresAt,
    url: buildInviteUrl(r.token),
    isExpired: r.expiresAt.getTime() <= now.getTime(),
    createdAt: r.createdAt,
  }));
}

export async function getPendingIncomingInviteCount(): Promise<number> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return 0;

  const email = session.user.email.toLowerCase();
  const now = new Date();

  const rows = await db
    .select({ id: invite.id })
    .from(invite)
    .where(
      and(
        eq(invite.email, email),
        eq(invite.kind, "email"),
        eq(invite.status, "pending"),
        gt(invite.expiresAt, now)
      )
    );

  return rows.length;
}

// ── Recipient actions ──────────────────────────────────────────────────────

export async function getInvitePreview(token: string): Promise<InvitePreview> {
  const [row] = await db
    .select({
      id: invite.id,
      kind: invite.kind,
      status: invite.status,
      expiresAt: invite.expiresAt,
      inviterId: invite.inviterId,
      inviterName: user.name,
      inviterImage: user.image,
    })
    .from(invite)
    .innerJoin(user, eq(invite.inviterId, user.id))
    .where(eq(invite.token, token))
    .limit(1);

  if (!row) return { status: "not_found" };

  const now = new Date();
  if (row.status === "revoked") return { status: "revoked" };
  if (row.status === "accepted") return { status: "accepted" };
  if (row.status === "pending" && row.expiresAt.getTime() <= now.getTime()) {
    return { status: "expired" };
  }

  const babies = await db
    .select({
      id: baby.id,
      name: baby.name,
      photoUrl: baby.photoUrl,
      birthdate: baby.birthdate,
    })
    .from(baby)
    .where(eq(baby.userId, row.inviterId))
    .orderBy(desc(baby.createdAt))
    .limit(3);

  return {
    status: "valid",
    kind: row.kind,
    inviter: {
      id: row.inviterId,
      name: row.inviterName,
      image: row.inviterImage ?? null,
    },
    babies: babies.map((b) => ({
      id: b.id,
      name: b.name,
      photoUrl: b.photoUrl,
      birthdate: b.birthdate,
    })),
  };
}

export async function acceptInvite(token: string): Promise<{ inviterId: string }> {
  const session = await getSession();

  const [row] = await db.select().from(invite).where(eq(invite.token, token)).limit(1);

  if (!row) throw new Error("Invite not found");

  const now = new Date();
  if (row.status === "revoked") throw new Error("This invite is no longer valid");
  if (row.status === "accepted" && row.kind === "email") {
    throw new Error("This invite has already been accepted");
  }
  if (row.expiresAt.getTime() <= now.getTime()) throw new Error("This invite has expired");
  if (row.inviterId === session.user.id) throw new Error("This is your own invite");

  if (row.kind === "email") {
    const sessionEmail = session.user.email.toLowerCase();
    if (!session.user.emailVerified) {
      throw new Error("Please verify your email before accepting this invite");
    }
    if (sessionEmail !== row.email) {
      throw new Error("This invite was sent to a different email address");
    }
  }

  const followIdA = crypto.randomUUID();
  const followIdB = crypto.randomUUID();

  if (row.kind === "email") {
    // Atomic: update invite + insert both follow rows in a single CTE.
    // The follow inserts only run if the invite update affected a row.
    const result = await db.execute(sql`
      WITH accepted_invite AS (
        UPDATE ${invite}
        SET status = 'accepted',
            accepted_by_user_id = ${session.user.id},
            accepted_at = ${now}
        WHERE id = ${row.id} AND status = 'pending'
        RETURNING id
      ),
      mutual_follows AS (
        INSERT INTO ${follow} (id, follower_id, following_id, status, created_at, updated_at)
        SELECT ${followIdA}, ${row.inviterId}, ${session.user.id}, 'accepted', now(), now()
        FROM accepted_invite
        UNION ALL
        SELECT ${followIdB}, ${session.user.id}, ${row.inviterId}, 'accepted', now(), now()
        FROM accepted_invite
        ON CONFLICT (follower_id, following_id)
        DO UPDATE SET status = 'accepted', updated_at = now()
        RETURNING id
      )
      SELECT (SELECT count(*) FROM accepted_invite)::int AS accepted_count
    `);
    const acceptedCount = Number(
      (result as unknown as { rows?: { accepted_count: number }[] }).rows?.[0]?.accepted_count ??
        (Array.isArray(result) ? (result[0] as { accepted_count: number })?.accepted_count : 0)
    );
    if (!acceptedCount) throw new Error("This invite is no longer valid");
  } else {
    // Link-kind: just upsert the mutual follow rows; invite stays pending.
    await db.execute(sql`
      INSERT INTO ${follow} (id, follower_id, following_id, status, created_at, updated_at)
      VALUES
        (${followIdA}, ${row.inviterId}, ${session.user.id}, 'accepted', now(), now()),
        (${followIdB}, ${session.user.id}, ${row.inviterId}, 'accepted', now(), now())
      ON CONFLICT (follower_id, following_id)
      DO UPDATE SET status = 'accepted', updated_at = now()
    `);
  }

  revalidatePath("/following");
  revalidatePath("/timeline");

  return { inviterId: row.inviterId };
}
