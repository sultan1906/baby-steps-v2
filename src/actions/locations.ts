"use server";

import { db } from "@/db";
import { savedLocation } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

/**
 * Save a new location for the current user.
 */
export async function createSavedLocation(data: {
  nickname: string;
  address: string;
  fullName?: string;
}) {
  const session = await getSession();

  const [loc] = await db
    .insert(savedLocation)
    .values({ ...data, userId: session.user.id })
    .returning();

  return loc;
}

/**
 * Get all saved locations for the current user, newest first.
 */
export async function getSavedLocations() {
  const session = await getSession();

  return db
    .select()
    .from(savedLocation)
    .where(eq(savedLocation.userId, session.user.id))
    .orderBy(desc(savedLocation.createdAt));
}
