"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Lock, Baby } from "lucide-react";
import { BackButton } from "@/components/shared/back-button";
import { UserAvatar } from "@/components/social/user-avatar";
import { BabyAvatar } from "@/components/baby/baby-avatar";
import { FollowButton } from "@/components/social/follow-button";
import { toast } from "sonner";
import type { UserProfile, FollowStatus } from "@/types";

interface ProfileClientProps {
  profile: UserProfile;
}

export function ProfileClient({ profile: initial }: ProfileClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [followStatus, setFollowStatus] = useState<FollowStatus>(initial.followStatus);

  const canSeeBabies = followStatus === "accepted";

  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      toast.success(`You're now connected with ${initial.name}`);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("welcome");
      const next = params.toString();
      router.replace(`/profile/${initial.id}${next ? `?${next}` : ""}`, { scroll: false });
    }
  }, [searchParams, initial.id, initial.name, router]);

  const handleStatusChange = (newStatus: FollowStatus) => {
    setFollowStatus(newStatus);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-stone-100/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <BackButton />
          <h1 className="font-bold text-stone-800 text-lg">Profile</h1>
        </div>
      </div>

      <div className="px-4 pb-28 pt-6">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center text-center mb-6">
          <UserAvatar name={initial.name} image={initial.image} size={96} className="mb-4" />
          <h2 className="text-xl font-bold text-stone-800">{initial.name}</h2>
          {initial.location && (
            <p className="flex items-center gap-1 text-sm text-stone-400 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {initial.location}
            </p>
          )}
          {initial.bio && (
            <p className="text-sm text-stone-600 mt-3 max-w-xs leading-relaxed">{initial.bio}</p>
          )}
        </div>

        {/* Follow / Unfollow button — hidden for non-connected users */}
        {followStatus !== "none" && (
          <div className="flex justify-center mt-6 mb-8">
            <FollowButton
              userId={initial.id}
              initialStatus={initial.followStatus}
              onStatusChange={handleStatusChange}
              className="px-8 py-2.5"
            />
          </div>
        )}

        {/* Babies */}
        {canSeeBabies && initial.babies.length > 0 && (
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Baby className="w-5 h-5 text-rose-400" />
              <h3 className="font-bold text-stone-800">
                {initial.name.split(" ")[0]}&apos;s Babies
              </h3>
            </div>
            <div className="space-y-3">
              {initial.babies.map((b) => (
                <Link
                  key={b.id}
                  href={`/following/${initial.id}?babyId=${b.id}`}
                  className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-xl transition-colors hover:bg-stone-50"
                >
                  <BabyAvatar name={b.name} photoUrl={b.photoUrl} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 truncate">{b.name}</p>
                    <p className="text-xs text-stone-400">
                      Born{" "}
                      {new Date(b.birthdate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Private profile message */}
        {!canSeeBabies && (
          <div className="premium-card p-8 text-center">
            <Lock className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="font-medium text-stone-600">This profile is private</p>
            <p className="text-sm text-stone-400 mt-1">
              Follow this user to see their babies and memories
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
