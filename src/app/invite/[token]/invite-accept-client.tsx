"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/social/user-avatar";
import { BabyAvatar } from "@/components/baby/baby-avatar";
import { acceptInvite } from "@/actions/invites";
import { toast } from "sonner";
import type { ValidInvitePreview } from "@/types";

interface Props {
  token: string;
  preview: ValidInvitePreview;
  isSignedIn: boolean;
}

export function InviteAcceptClient({ token, preview, isSignedIn }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviter = preview.inviter;
  const babies = preview.babies;

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      const { inviterId } = await acceptInvite(token);
      toast.success(`You're now connected with ${inviter.name}`);
      router.push(`/profile/${inviterId}?welcome=1`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to accept invite";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="premium-card p-6 text-center">
        <UserAvatar name={inviter.name} image={inviter.image} size={80} className="mx-auto mb-4" />
        <h1 className="text-xl font-bold text-stone-800 mb-1">{inviter.name}</h1>
        <p className="text-sm text-stone-500 mb-6">
          invited you to follow{" "}
          {babies.length === 0
            ? "their baby's journey"
            : babies.length === 1
              ? `${babies[0].name}'s journey`
              : `${babies
                  .slice(0, -1)
                  .map((b) => b.name)
                  .join(", ")} and ${babies[babies.length - 1].name}'s journey`}{" "}
          on Baby Steps
        </p>

        {babies.length > 0 && (
          <div className="flex items-center justify-center gap-3 mb-6">
            {babies.map((b) => (
              <div key={b.id} className="flex flex-col items-center gap-1">
                <BabyAvatar name={b.name} photoUrl={b.photoUrl} size={48} />
                <p className="text-xs font-medium text-stone-700 truncate max-w-[80px]">{b.name}</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
        )}

        {isSignedIn ? (
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full px-6 py-3 rounded-2xl gradient-bg-vibrant text-white font-bold transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept invite"}
          </button>
        ) : (
          <div className="space-y-3">
            <Link
              href={`/auth?invite=${encodeURIComponent(token)}&mode=signup`}
              className="block w-full px-6 py-3 rounded-2xl gradient-bg-vibrant text-white font-bold transition-transform active:scale-95"
            >
              Sign up to accept
            </Link>
            <Link
              href={`/auth?invite=${encodeURIComponent(token)}`}
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
