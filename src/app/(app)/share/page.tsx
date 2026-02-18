import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCurrentBaby } from "@/lib/baby-utils";
import { db } from "@/db";
import { step } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ShareClient } from "./share-client";

export default async function SharePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth");

  const currentBaby = await getCurrentBaby(session.user.id);
  if (!currentBaby) redirect("/onboarding");

  const allSteps = await db
    .select()
    .from(step)
    .where(eq(step.babyId, currentBaby.id))
    .orderBy(desc(step.date));

  const photoSteps = allSteps.filter((s) => s.photoUrl);

  return <ShareClient steps={photoSteps} baby={currentBaby} />;
}
