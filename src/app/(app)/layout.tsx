import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getCurrentBaby, resolveNoBabyDestination } from "@/lib/baby-utils";
import { listBabies } from "@/actions/baby";
import { getPendingIncomingInviteCount } from "@/actions/invites";
import { consumePendingInvite } from "@/lib/post-auth-invite";
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

  const pathname = headersList.get("x-pathname") ?? "";

  // Redeem any pending invite that was stashed before authentication.
  // Skip on the profile page itself (avoids redirect loop after we send the user there).
  if (!pathname.startsWith("/profile/")) {
    const inviteRedirect = await consumePendingInvite();
    if (inviteRedirect) redirect(inviteRedirect);
  }

  const currentBaby = await getCurrentBaby(session.user.id);

  if (!currentBaby) {
    // Allow onboarding and follower-friendly routes
    const isOnboarding = pathname === "/onboarding";
    const isAllowed = ALLOWED_WITHOUT_BABY.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (!isOnboarding && !isAllowed) {
      redirect(await resolveNoBabyDestination(session.user.id));
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
    const pendingInviteCount = await getPendingIncomingInviteCount();

    return (
      <QueryProvider>
        <BabyProvider
          baby={null}
          user={{ ...session.user, image: session.user.image ?? null }}
          babies={[]}
          pendingInviteCount={pendingInviteCount}
        >
          <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto">{children}</main>
            <BottomNav followerMode />
          </div>
          <Toaster position="top-center" />
        </BabyProvider>
      </QueryProvider>
    );
  }

  // Full mode: user has babies
  const [allBabies, pendingInviteCount] = await Promise.all([
    listBabies(),
    getPendingIncomingInviteCount(),
  ]);

  return (
    <QueryProvider>
      <BabyProvider
        baby={currentBaby}
        user={{ ...session.user, image: session.user.image ?? null }}
        babies={allBabies}
        pendingInviteCount={pendingInviteCount}
      >
        <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">{children}</main>
          <BottomNav />
        </div>
        <Toaster position="top-center" />
      </BabyProvider>
    </QueryProvider>
  );
}
