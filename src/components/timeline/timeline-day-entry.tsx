"use client";

import { parseISO } from "date-fns";
import { MoreHorizontal, Plus, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { getDayNumber, formatShortDate } from "@/lib/date-utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DayPhotoCarousel } from "./day-photo-carousel";
import { MobileDayCard } from "./mobile-day-card";
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
  description?: string;
  isFirst?: boolean;
  isLast?: boolean;
  readOnly?: boolean;
  onOpenStory: (date: string, steps: Step[]) => void;
}

export function TimelineDayEntry({
  date,
  steps,
  birthdate,
  description,
  isFirst,
  isLast,
  readOnly,
  onOpenStory,
}: TimelineDayEntryProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (isMobile) {
    return (
      <>
        <div className="flex">
          {/* Left axis column */}
          <div className="relative w-8 flex-shrink-0 flex justify-center">
            <div
              className={`absolute ${isFirst ? "top-[10px]" : "top-0"} bottom-0 w-0.5 bg-emerald-400/40`}
            />
            <div className="relative z-10 mt-3 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
          </div>
          {/* Card content */}
          <div className="flex-1 min-w-0 pr-1">
            <MobileDayCard
              date={date}
              steps={steps}
              birthdate={birthdate}
              description={description}
              readOnly={readOnly}
              onOpenStory={onOpenStory}
            />
          </div>
        </div>
        {isLast && (
          <div className="flex">
            <div className="relative w-8 flex-shrink-0 flex justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
            </div>
          </div>
        )}
      </>
    );
  }

  const dayNumber = getDayNumber(parseISO(birthdate), parseISO(date));
  const shortDate = formatShortDate(date);
  const hasMedia = steps.some((s) => s.photoUrl);

  // Use first step caption as fallback description
  const displayDescription = description || steps.find((s) => s.caption)?.caption;

  return (
    <>
      <motion.div
        className="flex"
        initial={{ opacity: 0, x: -12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {/* Left axis column */}
        <div className="relative w-10 flex-shrink-0 flex justify-center">
          {/* Continuous vertical line — first entry starts from circle center */}
          <div
            className={`absolute ${isFirst ? "top-[10px]" : "top-0"} bottom-0 w-0.5 bg-emerald-400/40`}
          />
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
            </div>

            {/* Three-dot menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                suppressHydrationWarning
                aria-label={`Open actions for ${shortDate}`}
                className="p-1 text-stone-400 hover:text-stone-600 transition-colors rounded-full hover:bg-stone-100"
              >
                <MoreHorizontal className="w-5 h-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom">
                <DropdownMenuItem onClick={() => onOpenStory(date, steps)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View day
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Photo carousel or empty placeholder */}
          {hasMedia ? (
            <DayPhotoCarousel steps={steps} onTap={() => onOpenStory(date, steps)} />
          ) : readOnly ? (
            <div className="w-full rounded-2xl p-4 bg-stone-50/50 border border-stone-100">
              <span className="text-sm text-stone-400">No media for this day</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenStory(date, steps)}
              aria-label={`Add a memory for ${shortDate}`}
              className="w-full border-2 border-dashed border-stone-200 rounded-2xl p-6 flex items-center gap-3 cursor-pointer hover:border-rose-300 hover:bg-rose-50/30 transition-colors"
            >
              <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-stone-400">Tap to add a memory</span>
            </button>
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

      {/* End cap circle after the last entry in each month */}
      {isLast && (
        <div className="flex">
          <div className="relative w-10 flex-shrink-0 flex justify-center">
            <div className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
          </div>
        </div>
      )}
    </>
  );
}
