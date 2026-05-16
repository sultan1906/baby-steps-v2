import { db } from "@/db";
import { baby, babyAccess, user } from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { UserError } from "@/lib/errors";

export type CoParent = {
  accessId: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  addedAt: Date;
};

export async function hasBabyAccess(babyId: string, userId: string): Promise<boolean> {
  const [owned] = await db
    .select({ id: baby.id })
    .from(baby)
    .where(and(eq(baby.id, babyId), eq(baby.userId, userId)))
    .limit(1);
  if (owned) return true;

  const [shared] = await db
    .select({ id: babyAccess.id })
    .from(babyAccess)
    .where(and(eq(babyAccess.babyId, babyId), eq(babyAccess.userId, userId)))
    .limit(1);
  return Boolean(shared);
}

export async function assertBabyAccess(babyId: string, userId: string): Promise<void> {
  const allowed = await hasBabyAccess(babyId, userId);
  if (!allowed) throw new UserError("Not found or unauthorized");
}

export async function assertBabyOwner(babyId: string, userId: string): Promise<void> {
  const [owned] = await db
    .select({ id: baby.id })
    .from(baby)
    .where(and(eq(baby.id, babyId), eq(baby.userId, userId)))
    .limit(1);
  if (!owned) throw new UserError("Not found or unauthorized");
}

export async function isBabyOwner(babyId: string, userId: string): Promise<boolean> {
  const [owned] = await db
    .select({ id: baby.id })
    .from(baby)
    .where(and(eq(baby.id, babyId), eq(baby.userId, userId)))
    .limit(1);
  return Boolean(owned);
}

export async function getAccessibleBabyIds(userId: string): Promise<string[]> {
  const [owned, shared] = await Promise.all([
    db.select({ id: baby.id }).from(baby).where(eq(baby.userId, userId)),
    db.select({ id: babyAccess.babyId }).from(babyAccess).where(eq(babyAccess.userId, userId)),
  ]);
  return Array.from(new Set([...owned.map((r) => r.id), ...shared.map((r) => r.id)]));
}

export async function listAccessibleBabies(userId: string) {
  const ids = await getAccessibleBabyIds(userId);
  if (ids.length === 0) return [];
  return db.select().from(baby).where(inArray(baby.id, ids)).orderBy(desc(baby.createdAt));
}

export async function assertBabiesAccessible(babyIds: string[], userId: string): Promise<void> {
  if (babyIds.length === 0) return;
  const accessible = await getAccessibleBabyIds(userId);
  const allowed = new Set(accessible);
  if (babyIds.some((id) => !allowed.has(id))) {
    throw new UserError("Not found or unauthorized");
  }
}

export async function listCoParents(babyId: string): Promise<CoParent[]> {
  const rows = await db
    .select({
      accessId: babyAccess.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      addedAt: babyAccess.addedAt,
    })
    .from(babyAccess)
    .innerJoin(user, eq(babyAccess.userId, user.id))
    .where(eq(babyAccess.babyId, babyId))
    .orderBy(desc(babyAccess.addedAt));
  return rows;
}
