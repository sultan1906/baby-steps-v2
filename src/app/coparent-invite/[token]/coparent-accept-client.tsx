"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/social/user-avatar";
import { BabyAvatar } from "@/components/baby/baby-avatar";
import { acceptCoParentInvite } from "@/actions/baby-invites";
import { toast } from "sonner";
import type { ValidCoParentInvitePreview } from "@/types";

interface Props {
  token: string;
  preview: ValidCoParentInvitePreview;
  isSignedIn: boolean;
}

export function CoParentAcceptClient({ token, preview, isSignedIn }: Props) {
  const { push } = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { inviter, baby } = preview;

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      await acceptCoParentInvite(token);
      toast.success(`You're now co-parenting ${baby.name}`);
      push(`/timeline?coparent=joined`);
    } catch (err) {
      // Surface only known public messages; everything else gets a generic fallback
      // so internal details never leak through server-action error text.
      const raw = err instanceof Error ? err.message : "";
      const publicMessages = new Set([
        "Invite not found",
        "This invite is no longer valid",
        "This invite has already been accepted",
        "This invite has expired",
        "This invite was sent to a different email address",
        "This is your own invite",
        "Please verify your email before accepting this invite",
        "Unauthorized",
      ]);
      setError(publicMessages.has(raw) ? raw : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="premium-card p-6 text-center">
        <UserAvatar name={inviter.name} image={inviter.image} size={80} className="mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-stone-800 mb-1">{inviter.name}</h1>
        <p className="text-sm text-stone-500 mb-6">
          invited you to co-parent <span className="font-medium text-stone-700">{baby.name}</span>{" "}
          on Baby Steps. You&apos;ll be able to upload, edit and organise memories together.
        </p>

        <div className="flex items-center justify-center mb-6">
          <div className="flex flex-col items-center gap-1">
            <BabyAvatar name={baby.name} photoUrl={baby.photoUrl} size={64} />
            <p className="text-sm font-medium text-stone-700 truncate max-w-[120px]">{baby.name}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
        )}

        {isSignedIn ? (
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full px-6 py-3 rounded-2xl gradient-bg-vibrant text-white font-bold transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Accept & join"}
          </button>
        ) : (
          <div className="space-y-3">
            <Link
              href={`/auth?coparent=${encodeURIComponent(token)}&mode=signup`}
              className="block w-full px-6 py-3 rounded-2xl gradient-bg-vibrant text-white font-bold transition-transform active:scale-95"
            >
              Sign up to accept
            </Link>
            <Link
              href={`/auth?coparent=${encodeURIComponent(token)}`}
              className="block w-full px-6 py-3 rounded-2xl bg-stone-100 text-stone-700 font-medium transition-colors hover:bg-stone-200"
            >
              I already have an account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
