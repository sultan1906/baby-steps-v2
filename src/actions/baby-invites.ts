"use server";

import { db } from "@/db";
import { babyAccess, babyInvite, baby, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { assertBabyOwner, hasBabyAccess, sqlBabyOwned } from "@/lib/baby-access";
import { getResend } from "@/lib/resend";
import { CoParentInviteEmail } from "@/emails/CoParentInviteEmail";
import { render } from "@react-email/components";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, desc, eq, gt, lte, sql } from "drizzle-orm";
import crypto from "node:crypto";
import { UserError, runAction } from "@/lib/errors";
import type { CoParentInvitePreview, PendingCoParentInviteItem } from "@/types";

const ONE_DAY_MS = 1000 * 60 * 60 * 24;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new UserError("Unauthorized");
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
  return `${base}/coparent-invite/${token}`;
}

async function sendCoParentEmail(args: {
  to: string;
  inviterName: string;
  babyName: string;
  inviteUrl: string;
}) {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    throw new Error("Email is not configured (RESEND_FROM_EMAIL missing)");
  }

  const html = await render(
    CoParentInviteEmail({
      inviterName: args.inviterName,
      babyName: args.babyName,
      inviteUrl: args.inviteUrl,
    })
  );

  const { error } = await getResend().emails.send({
    from,
    to: args.to,
    subject: `${args.inviterName} invited you to co-parent ${args.babyName}`,
    html,
  });

  if (error) {
    console.error("Resend co-parent invite email failed", {
      error,
      recipientDomain: args.to.split("@")[1] ?? null,
    });
    throw new UserError("Couldn't send invite email");
  }
}

// ── Owner-only actions ─────────────────────────────────────────────────────

export async function createCoParentEmailInvite(
  babyId: string,
  emailRaw: string
): Promise<{ inviteId: string; status: "sent" | "resent" }> {
  return runAction("createCoParentEmailInvite", async () => {
    const session = await getSession();
    await assertBabyOwner(babyId, session.user.id);

    const email = emailRaw.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) throw new UserError("Enter a valid email address");
    if (email === session.user.email.toLowerCase()) {
      throw new UserError("You can't invite yourself");
    }

    // If this email already belongs to an existing co-parent on this baby, short-circuit.
    const [existingUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(sql`lower(${user.email})`, email))
      .limit(1);
    if (existingUser) {
      const [already] = await db
        .select({ id: babyAccess.id })
        .from(babyAccess)
        .where(and(eq(babyAccess.babyId, babyId), eq(babyAccess.userId, existingUser.id)))
        .limit(1);
      if (already) throw new UserError("They're already a co-parent on this baby");
    }

    const now = new Date();

    // Expire any stale pending rows for the same (baby, email) so the partial
    // unique index doesn't collide on insert.
    await db
      .update(babyInvite)
      .set({ status: "expired" })
      .where(
        and(
          eq(babyInvite.babyId, babyId),
          eq(babyInvite.email, email),
          eq(babyInvite.kind, "email"),
          eq(babyInvite.status, "pending"),
          lte(babyInvite.expiresAt, now)
        )
      );

    const [[existingPending], [babyRow], [inviterRow]] = await Promise.all([
      db
        .select()
        .from(babyInvite)
        .where(
          and(
            eq(babyInvite.babyId, babyId),
            eq(babyInvite.email, email),
            eq(babyInvite.kind, "email"),
            eq(babyInvite.status, "pending"),
            gt(babyInvite.expiresAt, now)
          )
        )
        .limit(1),
      db.select({ name: baby.name }).from(baby).where(eq(baby.id, babyId)).limit(1),
      db.select({ name: user.name }).from(user).where(eq(user.id, session.user.id)).limit(1),
    ]);

    if (!babyRow) throw new UserError("Baby not found");
    const inviterName = inviterRow?.name ?? "A friend";
    const babyName = babyRow.name;

    if (existingPending) {
      const refreshedExpiresAt = new Date(now.getTime() + ONE_DAY_MS);
      await db
        .update(babyInvite)
        .set({ expiresAt: refreshedExpiresAt })
        .where(eq(babyInvite.id, existingPending.id));

      await sendCoParentEmail({
        to: email,
        inviterName,
        babyName,
        inviteUrl: buildInviteUrl(existingPending.token),
      });
      revalidatePath("/settings");
      revalidatePath("/settings/baby");
      return { inviteId: existingPending.id, status: "resent" };
    }

    const token = generateToken();
    const expiresAt = new Date(now.getTime() + ONE_DAY_MS);

    const [inserted] = await db
      .insert(babyInvite)
      .values({
        babyId,
        inviterId: session.user.id,
        kind: "email",
        email,
        token,
        status: "pending",
        expiresAt,
      })
      .returning({ id: babyInvite.id, token: babyInvite.token });

    await sendCoParentEmail({
      to: email,
      inviterName,
      babyName,
      inviteUrl: buildInviteUrl(inserted.token),
    });

    revalidatePath("/settings");
    revalidatePath("/settings/baby");
    return { inviteId: inserted.id, status: "sent" };
  });
}

export async function createCoParentLinkInvite(
  babyId: string
): Promise<{ inviteId: string; url: string }> {
  return runAction("createCoParentLinkInvite", async () => {
    const session = await getSession();
    await assertBabyOwner(babyId, session.user.id);

    const now = new Date();
    const [existing] = await db
      .select()
      .from(babyInvite)
      .where(
        and(
          eq(babyInvite.babyId, babyId),
          eq(babyInvite.inviterId, session.user.id),
          eq(babyInvite.kind, "link"),
          eq(babyInvite.status, "pending"),
          gt(babyInvite.expiresAt, now)
        )
      )
      .orderBy(desc(babyInvite.createdAt))
      .limit(1);

    if (existing) {
      return { inviteId: existing.id, url: buildInviteUrl(existing.token) };
    }

    const token = generateToken();
    const expiresAt = new Date(now.getTime() + ONE_DAY_MS);

    const [inserted] = await db
      .insert(babyInvite)
      .values({
        babyId,
        inviterId: session.user.id,
        kind: "link",
        email: null,
        token,
        status: "pending",
        expiresAt,
      })
      .returning({ id: babyInvite.id, token: babyInvite.token });

    revalidatePath("/settings");
    revalidatePath("/settings/baby");
    return { inviteId: inserted.id, url: buildInviteUrl(inserted.token) };
  });
}

export async function revokeCoParentInvite(inviteId: string): Promise<void> {
  return runAction("revokeCoParentInvite", async () => {
    const session = await getSession();

    const updated = await db
      .update(babyInvite)
      .set({ status: "revoked" })
      .where(
        and(
          eq(babyInvite.id, inviteId),
          eq(babyInvite.status, "pending"),
          sqlBabyOwned(babyInvite.babyId, session.user.id)
        )
      )
      .returning({ id: babyInvite.id });
    if (updated.length === 0) throw new UserError("Invite not found");

    revalidatePath("/settings");
    revalidatePath("/settings/baby");
  });
}

export async function listCoParentInvites(babyId: string): Promise<PendingCoParentInviteItem[]> {
  return runAction("listCoParentInvites", async () => {
    const session = await getSession();
    await assertBabyOwner(babyId, session.user.id);

    const rows = await db
      .select()
      .from(babyInvite)
      .where(and(eq(babyInvite.babyId, babyId), eq(babyInvite.status, "pending")))
      .orderBy(desc(babyInvite.createdAt));

    const now = new Date();
    return rows.map((r) => ({
      id: r.id,
      babyId: r.babyId,
      kind: r.kind,
      email: r.email,
      expiresAt: r.expiresAt,
      url: buildInviteUrl(r.token),
      isExpired: r.expiresAt.getTime() <= now.getTime(),
      createdAt: r.createdAt,
    }));
  });
}

// ── Recipient actions ──────────────────────────────────────────────────────

export async function getCoParentInvitePreview(token: string): Promise<CoParentInvitePreview> {
  return runAction("getCoParentInvitePreview", async () => {
    const [row] = await db
      .select({
        id: babyInvite.id,
        babyId: babyInvite.babyId,
        kind: babyInvite.kind,
        status: babyInvite.status,
        expiresAt: babyInvite.expiresAt,
        inviterId: babyInvite.inviterId,
        inviterName: user.name,
        inviterImage: user.image,
      })
      .from(babyInvite)
      .innerJoin(user, eq(babyInvite.inviterId, user.id))
      .where(eq(babyInvite.token, token))
      .limit(1);

    if (!row) return { status: "not_found" };

    const now = new Date();
    if (row.status === "revoked") return { status: "revoked" };
    if (row.status === "accepted") return { status: "accepted" };
    if (row.status === "expired") return { status: "expired" };
    if (row.status === "pending" && row.expiresAt.getTime() <= now.getTime()) {
      return { status: "expired" };
    }

    const [babyRow] = await db
      .select({
        id: baby.id,
        name: baby.name,
        photoUrl: baby.photoUrl,
        birthdate: baby.birthdate,
      })
      .from(baby)
      .where(eq(baby.id, row.babyId))
      .limit(1);

    if (!babyRow) return { status: "not_found" };

    return {
      status: "valid",
      kind: row.kind,
      inviter: { id: row.inviterId, name: row.inviterName, image: row.inviterImage ?? null },
      baby: babyRow,
    };
  });
}

export async function acceptCoParentInvite(token: string): Promise<{ babyId: string }> {
  return runAction("acceptCoParentInvite", async () => {
    const session = await getSession();
    const [row] = await db.select().from(babyInvite).where(eq(babyInvite.token, token)).limit(1);

    if (!row) throw new UserError("Invite not found");

    const now = new Date();
    if (row.status === "revoked") throw new UserError("This invite is no longer valid");
    if (row.status === "accepted" && row.kind === "email") {
      throw new UserError("This invite has already been accepted");
    }
    if (row.expiresAt.getTime() <= now.getTime()) throw new UserError("This invite has expired");
    if (row.inviterId === session.user.id) throw new UserError("This is your own invite");

    if (row.kind === "email") {
      if (!session.user.emailVerified) {
        throw new UserError("Please verify your email before accepting this invite");
      }
      if (session.user.email.toLowerCase() !== row.email) {
        throw new UserError("This invite was sent to a different email address");
      }
    }

    // Already a co-parent? Make accept idempotent.
    const already = await hasBabyAccess(row.babyId, session.user.id);
    if (already) {
      if (row.kind === "email" && row.status === "pending") {
        await db
          .update(babyInvite)
          .set({
            status: "accepted",
            acceptedByUserId: session.user.id,
            acceptedAt: new Date(),
          })
          .where(eq(babyInvite.id, row.id));
      }
      return { babyId: row.babyId };
    }

    if (row.kind === "email") {
      // Atomic: only insert babyAccess when invite update succeeds.
      const result = await db.execute(sql`
        WITH accepted_invite AS (
          UPDATE ${babyInvite}
          SET status = 'accepted',
              accepted_by_user_id = ${session.user.id},
              accepted_at = now()
          WHERE id = ${row.id} AND status = 'pending'
          RETURNING id, baby_id, inviter_id
        )
        INSERT INTO ${babyAccess} (id, baby_id, user_id, role, added_by_user_id, added_at)
        SELECT ${crypto.randomUUID()}, baby_id, ${session.user.id}, 'coparent'::baby_access_role, inviter_id, now()
        FROM accepted_invite
        ON CONFLICT (baby_id, user_id) DO NOTHING
        RETURNING id
      `);
      const rows =
        (result as unknown as { rows?: unknown[] }).rows ?? (result as unknown as unknown[]);
      if (!Array.isArray(rows) || rows.length === 0) {
        // Race: a concurrent accept (same user, different tab/device) may have
        // already inserted baby_access. Don't throw if the user effectively has access.
        const nowHasAccess = await hasBabyAccess(row.babyId, session.user.id);
        if (!nowHasAccess) throw new UserError("This invite is no longer valid");
      }
    } else {
      // Link kind: invite stays pending so others can still use it.
      await db
        .insert(babyAccess)
        .values({
          babyId: row.babyId,
          userId: session.user.id,
          role: "coparent",
          addedByUserId: row.inviterId,
        })
        .onConflictDoNothing({ target: [babyAccess.babyId, babyAccess.userId] });
    }

    revalidatePath("/timeline");
    revalidatePath("/dashboard");
    revalidatePath("/gallery");
    revalidatePath("/settings");
    return { babyId: row.babyId };
  });
}
