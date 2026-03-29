import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getCurrentBaby } from "@/lib/baby-utils";
import { listBabies } from "@/actions/baby";
import { getPendingRequestCount } from "@/actions/social";
import { BabyProvider } from "@/components/baby/baby-provider";
import { BottomNav } from "@/components/shared/bottom-nav";
import { QueryProvider } from "@/components/shared/query-provider";
import { Toaster } from "@/components/ui/sonner";

// Routes accessible without a baby (follower-only users)
const ALLOWED_WITHOUT_BABY = ["/following", "/profile", "/settings"];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session) {
    redirect("/auth");
  }

  const currentBaby = await getCurrentBaby(session.user.id);
  const pathname = headersList.get("x-pathname") ?? "";

  if (!currentBaby) {
    // Allow onboarding and follower-friendly routes
    const isOnboarding = pathname === "/onboarding";
    const isAllowed = ALLOWED_WITHOUT_BABY.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (!isOnboarding && !isAllowed) {
      redirect("/following");
    }

    // Onboarding gets minimal shell (no nav)
    if (isOnboarding) {
      return (
        <QueryProvider>
          <div className="min-h-screen bg-background">{children}</div>
          <Toaster position="top-center" />
        </QueryProvider>
      );
    }

    // Follower-only shell: BabyProvider with null baby + follower-mode nav
    const pendingRequestCount = await getPendingRequestCount();

    return (
      <QueryProvider>
        <BabyProvider
          baby={null}
          user={{ ...session.user, image: session.user.image ?? null }}
          babies={[]}
          pendingRequestCount={pendingRequestCount}
        >
          <div className="min-h-[100dvh] bg-background flex flex-col">
            <main className="flex-1 pb-24">{children}</main>
            <BottomNav followerMode />
          </div>
          <Toaster position="top-center" />
        </BabyProvider>
      </QueryProvider>
    );
  }

  // Full mode: user has babies
  const [allBabies, pendingRequestCount] = await Promise.all([
    listBabies(),
    getPendingRequestCount(),
  ]);

  return (
    <QueryProvider>
      <BabyProvider
        baby={currentBaby}
        user={{ ...session.user, image: session.user.image ?? null }}
        babies={allBabies}
        pendingRequestCount={pendingRequestCount}
      >
        <div className="min-h-[100dvh] bg-background flex flex-col">
          <main className="flex-1 pb-24">{children}</main>
          <BottomNav />
        </div>
        <Toaster position="top-center" />
      </BabyProvider>
    </QueryProvider>
  );
}
