import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCurrentBaby } from "@/lib/baby-utils";
import { db } from "@/db";
import { step, dailyDescription } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { TimelineClient } from "./timeline-client";

export default async function TimelinePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth");

  const currentBaby = await getCurrentBaby(session.user.id);
  if (!currentBaby) redirect("/following");

  // Fetch all steps and daily descriptions for this baby
  const [allSteps, allDescriptions] = await Promise.all([
    db
      .select()
      .from(step)
      .where(and(eq(step.babyId, currentBaby.id), sql`${step.type} != 'growth'`))
      .orderBy(step.date, step.createdAt),
    db.select().from(dailyDescription).where(eq(dailyDescription.babyId, currentBaby.id)),
  ]);

  return <TimelineClient steps={allSteps} baby={currentBaby} descriptions={allDescriptions} />;
}
