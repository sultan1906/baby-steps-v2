"use client";

import Link from "next/link";
import { Images, Share2, BarChart2, Settings } from "lucide-react";
import { BabySwitcherDropdown } from "@/components/baby/baby-switcher-dropdown";
import { useBaby } from "@/components/baby/baby-provider";
import { getAgeLabel } from "@/lib/date-utils";
import { parseISO } from "date-fns";

export function TimelineHeader() {
  const { baby } = useBaby();
  const ageLabel = getAgeLabel(parseISO(baby.birthdate));

  return (
    <div className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-stone-100/50">
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
          <Link href="/settings" className="text-stone-400 hover:text-rose-500 transition-colors">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
