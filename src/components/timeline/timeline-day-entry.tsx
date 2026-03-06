"use client";

import { parseISO } from "date-fns";
import { MoreHorizontal, Plus, Pencil, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { getDayNumber, formatShortDate, getMonthPillLabel } from "@/lib/date-utils";
import { DayPhotoCarousel } from "./day-photo-carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Step } from "@/types";

interface TimelineDayEntryProps {
  date: string;
  steps: Step[];
  birthdate: string;
  monthIndex: number;
  description?: string;
  isLast?: boolean;
  onOpenStory: (date: string, steps: Step[]) => void;
}

export function TimelineDayEntry({
  date,
  steps,
  birthdate,
  monthIndex,
  description,
  isLast,
  onOpenStory,
}: TimelineDayEntryProps) {
  const dayNumber = getDayNumber(parseISO(birthdate), parseISO(date));
  const shortDate = formatShortDate(date);
  const monthLabel = getMonthPillLabel(monthIndex);
  const hasMedia = steps.some((s) => s.photoUrl || s.type === "growth");

  // Use first step caption as fallback description
  const displayDescription = description || steps.find((s) => s.caption)?.caption;

  return (
    <motion.div
      className="flex"
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Left axis column */}
      <div className="relative w-10 flex-shrink-0 flex justify-center">
        {/* Continuous vertical line */}
        <div className={`absolute top-0 w-0.5 bg-emerald-400/40 ${isLast ? "h-3" : "bottom-0"}`} />
        {/* Circle node */}
        <div className="relative z-10 mt-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
      </div>

      {/* Right content */}
      <div className="flex-1 pb-8 pl-2 pr-4 min-w-0">
        {/* Header row */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-xs text-stone-400">{shortDate}</div>
            <div className="text-lg font-bold text-stone-800">{dayNumber} Days</div>
            <div className="text-[11px] text-stone-400">
              {shortDate} &middot; {monthLabel}
            </div>
          </div>

          {/* Three-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1 text-stone-400 hover:text-stone-600 transition-colors rounded-full hover:bg-stone-100">
              <MoreHorizontal className="w-5 h-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom">
              <DropdownMenuItem>
                <Plus className="w-4 h-4 mr-2" />
                Add memory
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Pencil className="w-4 h-4 mr-2" />
                Edit description
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="w-4 h-4 mr-2" />
                Share day
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Photo carousel or empty placeholder */}
        {hasMedia ? (
          <DayPhotoCarousel steps={steps} onTap={() => onOpenStory(date, steps)} />
        ) : (
          <div
            onClick={() => onOpenStory(date, steps)}
            className="border-2 border-dashed border-stone-200 rounded-2xl p-6 flex items-center gap-3 cursor-pointer hover:border-rose-300 hover:bg-rose-50/30 transition-colors"
          >
            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-stone-400">Tap to add a memory</span>
          </div>
        )}

        {/* Description */}
        {displayDescription && (
          <div className="mt-2 bg-white/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-stone-100/60">
            <p className="text-sm text-stone-600 leading-relaxed line-clamp-3">
              {displayDescription}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
