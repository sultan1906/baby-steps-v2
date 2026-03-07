"use client";

import Link from "next/link";
import { Images, Share2, BarChart2, Settings, Users } from "lucide-react";
import { BabySwitcherDropdown } from "@/components/baby/baby-switcher-dropdown";
import { useBaby } from "@/components/baby/baby-provider";
import { getAgeLabel } from "@/lib/date-utils";
import { parseISO } from "date-fns";

export function TimelineHeader() {
  const { baby, pendingRequestCount } = useBaby();
  const ageLabel = getAgeLabel(parseISO(baby.birthdate));

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Baby switcher */}
        <div className="flex items-center gap-3">
          <BabySwitcherDropdown />
          <div>
            <div className="font-bold text-stone-800 leading-tight">{baby.name}</div>
            <div className="text-xs text-stone-400">{ageLabel}</div>
          </div>
        </div>

        {/* Right: Icon row */}
        <div className="flex items-center gap-3">
          <Link href="/gallery" className="text-stone-400 hover:text-rose-500 transition-colors">
            <Images className="w-5 h-5" />
          </Link>
          <Link href="/share" className="text-stone-400 hover:text-rose-500 transition-colors">
            <Share2 className="w-5 h-5" />
          </Link>
          <Link href="/dashboard" className="text-stone-400 hover:text-rose-500 transition-colors">
            <BarChart2 className="w-5 h-5" />
          </Link>
          <Link
            href="/following"
            aria-label={
              pendingRequestCount > 0 ? `Following, ${pendingRequestCount} pending` : "Following"
            }
            className="text-stone-400 hover:text-rose-500 transition-colors relative"
          >
            <Users className="w-5 h-5" />
            {pendingRequestCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 gradient-bg-vibrant rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                {pendingRequestCount > 9 ? "9+" : pendingRequestCount}
              </span>
            )}
          </Link>
          <Link href="/settings" className="text-stone-400 hover:text-rose-500 transition-colors">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
