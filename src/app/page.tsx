import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getCurrentBaby } from "@/lib/baby-utils";
import { Footprints, ArrowRight } from "lucide-react";
import Link from "next/link";

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
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Gradient blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-rose-300/30 blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-300/30 blur-3xl animate-pulse" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm px-6">
        {/* Logo card */}
        <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-lg flex items-center justify-center mb-6">
          <Footprints className="w-8 h-8 text-rose-400" />
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold tracking-tighter mb-3">
          <span className="gradient-text">Babysteps</span>
        </h1>
        <p className="text-base text-stone-500 font-light mb-10">
          Every moment, beautifully remembered.
        </p>

        {/* CTA */}
        <Link
          href="/auth"
          className="gradient-bg-vibrant w-full py-4 rounded-[3rem] text-white font-bold text-lg flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(240,98,146,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          Start a Journey
          <ArrowRight className="w-5 h-5" />
        </Link>

        <p className="text-xs text-stone-400 mt-6">Free to get started · No credit card required</p>
      </div>
    </div>
  );
}
