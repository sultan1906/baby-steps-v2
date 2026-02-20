import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getCurrentBaby } from "@/lib/baby-utils";
import { LandingPage } from "@/components/landing/landing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Baby Steps — Capture Every Moment",
  description:
    "A beautiful, private journal to capture and cherish your baby's first steps, milestones, and memories.",
};

export default async function RootPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    const currentBaby = await getCurrentBaby(session.user.id);
    if (currentBaby) {
      redirect("/timeline");
    } else {
      redirect("/onboarding");
    }
  }

  // Marketing landing page (unauthenticated)
  return <LandingPage />;
}
