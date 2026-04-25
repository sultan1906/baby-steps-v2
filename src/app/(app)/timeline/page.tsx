import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCurrentBaby } from "@/lib/baby-utils";
import { db } from "@/db";
import { step } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TimelineClient } from "./timeline-client";

export default async function TimelinePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth");

  const currentBaby = await getCurrentBaby(session.user.id);
  if (!currentBaby) redirect("/following");

  const allSteps = await db
    .select()
    .from(step)
    .where(eq(step.babyId, currentBaby.id))
    .orderBy(step.date, step.createdAt);

  return <TimelineClient steps={allSteps} baby={currentBaby} />;
}
