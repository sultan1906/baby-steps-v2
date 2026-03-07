"use client";

import Link from "next/link";
import { ChevronRight, Baby } from "lucide-react";
import { UserAvatar } from "./user-avatar";
import type { FollowedUser } from "@/types";

interface FollowedUserCardProps {
  user: FollowedUser;
}

export function FollowedUserCard({ user }: FollowedUserCardProps) {
  const babyCount = user.babies.length;

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
      <ChevronRight className="w-4 h-4 text-stone-400" />
    </Link>
  );
}
