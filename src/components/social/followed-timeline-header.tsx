"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Check, Eye } from "lucide-react";
import { UserAvatar } from "./user-avatar";
import { BabyAvatar } from "@/components/baby/baby-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAgeLabel } from "@/lib/date-utils";
import { parseISO } from "date-fns";
import type { Baby } from "@/types";

interface FollowedTimelineHeaderProps {
  userName: string;
  userImage: string | null;
  userId: string;
  baby: Baby;
  babies: { id: string; name: string; photoUrl: string | null; birthdate: string }[];
}

export function FollowedTimelineHeader({
  userName,
  userImage,
  userId,
  baby,
  babies,
}: FollowedTimelineHeaderProps) {
  const router = useRouter();
  const ageLabel = getAgeLabel(parseISO(baby.birthdate));

  const handleSwitchBaby = (babyId: string) => {
    router.push(`/following/${userId}?babyId=${babyId}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Back + User info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/following")}
            className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <UserAvatar name={userName} image={userImage} size={32} />
          <div>
            <div className="font-bold text-stone-800 leading-tight text-sm">{userName}</div>
            <div className="flex items-center gap-1 text-xs text-stone-400">
              <Eye className="w-3 h-3" />
              <span>Viewing as follower</span>
            </div>
          </div>
        </div>

        {/* Right: Baby switcher */}
        {babies.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              suppressHydrationWarning
              className="flex items-center gap-2 focus:outline-none group"
            >
              <BabyAvatar name={baby.name} photoUrl={baby.photoUrl} size={36} />
              <div className="text-right">
                <div className="text-sm font-medium text-stone-700">{baby.name}</div>
                <div className="text-xs text-stone-400">{ageLabel}</div>
              </div>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1">
              {babies.map((b) => (
                <DropdownMenuItem
                  key={b.id}
                  onClick={() => handleSwitchBaby(b.id)}
                  className="flex items-center gap-3 rounded-xl p-2 cursor-pointer"
                >
                  <BabyAvatar name={b.name} photoUrl={b.photoUrl} size={32} />
                  <span className="flex-1 font-medium text-stone-800">{b.name}</span>
                  {b.id === baby.id && <Check className="w-4 h-4 text-rose-500" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <BabyAvatar name={baby.name} photoUrl={baby.photoUrl} size={36} />
            <div className="text-right">
              <div className="text-sm font-medium text-stone-700">{baby.name}</div>
              <div className="text-xs text-stone-400">{ageLabel}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
