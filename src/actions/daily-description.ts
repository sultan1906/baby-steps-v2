"use server";

import { db } from "@/db";
import { dailyDescription } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

/**
 * Upsert a daily description for a specific baby and date.
 * Uses the unique(babyId, date) constraint for ON CONFLICT DO UPDATE.
 */
export async function upsertDailyDescription(babyId: string, date: string, description: string) {
  await getSession();

  await db
    .insert(dailyDescription)
    .values({ babyId, date, description })
    .onConflictDoUpdate({
      target: [dailyDescription.babyId, dailyDescription.date],
      set: { description, updatedAt: new Date() },
    });
}

/**
 * Get the daily description for a specific baby and date.
 */
export async function getDailyDescription(babyId: string, date: string) {
  await getSession();

  return db.query.dailyDescription.findFirst({
    where: and(eq(dailyDescription.babyId, babyId), eq(dailyDescription.date, date)),
  });
}
