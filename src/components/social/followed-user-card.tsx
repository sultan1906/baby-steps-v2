"use client";

import { useState } from "react";
import Link from "next/link";
import { Baby, UserMinus } from "lucide-react";
import { UserAvatar } from "./user-avatar";
import { unfollowUser } from "@/actions/social";
import type { FollowedUser } from "@/types";

interface FollowedUserCardProps {
  user: FollowedUser;
  onUnfollow?: (userId: string) => void;
}

export function FollowedUserCard({ user, onUnfollow }: FollowedUserCardProps) {
  const [unfollowing, setUnfollowing] = useState(false);
  const babyCount = user.babies.length;

  const handleUnfollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUnfollowing(true);
    onUnfollow?.(user.id);
    await unfollowUser(user.id);
  };

  return (
    <Link
      href={`/following/${user.id}`}
      className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-xl hover:bg-stone-50 transition-colors"
    >
      <UserAvatar name={user.name} image={user.image} size={44} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-stone-800 truncate">{user.name}</p>
        <div className="flex items-center gap-1 text-xs text-stone-400">
          <Baby className="w-3 h-3" />
          <span>
            {babyCount} {babyCount === 1 ? "baby" : "babies"}
          </span>
        </div>
      </div>
      <button
        onClick={handleUnfollow}
        disabled={unfollowing}
        aria-label={`Unfollow ${user.name}`}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
      >
        <UserMinus className="w-4 h-4" />
      </button>
    </Link>
  );
}
