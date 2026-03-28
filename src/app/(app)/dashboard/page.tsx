import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCurrentBaby } from "@/lib/baby-utils";
import { db } from "@/db";
import { step } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth");

  const currentBaby = await getCurrentBaby(session.user.id);
  if (!currentBaby) redirect("/following");

  const allSteps = await db
    .select()
    .from(step)
    .where(and(eq(step.babyId, currentBaby.id), sql`${step.type} != 'growth'`))
    .orderBy(step.date);

  return <DashboardClient steps={allSteps} />;
}
