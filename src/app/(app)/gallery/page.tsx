import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCurrentBaby } from "@/lib/baby-utils";
import { db } from "@/db";
import { step } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { GalleryClient } from "./gallery-client";

export default async function GalleryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth");

  const currentBaby = await getCurrentBaby(session.user.id);
  if (!currentBaby) redirect("/onboarding");

  const allSteps = await db
    .select()
    .from(step)
    .where(eq(step.babyId, currentBaby.id))
    .orderBy(desc(step.date));

  return <GalleryClient steps={allSteps} baby={currentBaby} />;
}
