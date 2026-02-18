import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getCurrentBaby } from "@/lib/baby-utils";
import { listBabies } from "@/actions/baby";
import { BabyProvider } from "@/components/baby/baby-provider";
import { BottomNav } from "@/components/shared/bottom-nav";
import { QueryProvider } from "@/components/shared/query-provider";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session) {
    redirect("/auth");
  }

  const currentBaby = await getCurrentBaby(session.user.id);
  const pathname = headersList.get("x-pathname") ?? "";

  // Avoid redirect loop: don't redirect to /onboarding if already there
  if (!currentBaby && pathname !== "/onboarding") {
    redirect("/onboarding");
  }

  // On /onboarding with no baby, render a minimal shell (no BabyProvider)
  if (!currentBaby) {
    return (
      <QueryProvider>
        <div className="min-h-screen bg-background">{children}</div>
        <Toaster position="top-center" />
      </QueryProvider>
    );
  }

  // Fetch all babies for the switcher
  const allBabies = await listBabies();

  return (
    <QueryProvider>
      <BabyProvider
        baby={currentBaby}
        user={{ ...session.user, image: session.user.image ?? null }}
        babies={allBabies}
      >
        <div className="min-h-screen bg-background">
          <main className="pb-24">{children}</main>
          <BottomNav />
        </div>
        <Toaster position="top-center" />
      </BabyProvider>
    </QueryProvider>
  );
}
