"use client";

import { useEffect, useRef } from "react";
import { parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getTotalMonths,
  getMonthPillLabel,
  getMonthPillDateRange,
  isDateInMonth,
  getAgeInMonths,
} from "@/lib/date-utils";
import type { Step } from "@/types";

interface HorizontalMonthTimelineProps {
  birthdate: string;
  steps: Step[];
  selectedMonth: number;
  onMonthSelect: (monthIndex: number) => void;
}

export function HorizontalMonthTimeline({
  birthdate,
  steps,
  selectedMonth,
  onMonthSelect,
}: HorizontalMonthTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const birthdateDate = parseISO(birthdate);
  const totalMonths = getTotalMonths(birthdateDate);
  const currentAgeMonths = getAgeInMonths(birthdateDate);

  // Auto-scroll selected month into view
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const pill = container.querySelector(`[data-month="${selectedMonth}"]`) as HTMLElement;
    if (!pill) return;
    pill.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedMonth]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/60 backdrop-blur-xl border-t border-stone-100/50 safe-area-inset-bottom pt-4">
      <div
        ref={scrollRef}
        className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-hide overscroll-x-contain"
      >
        {Array.from({ length: totalMonths }, (_, i) => {
          const hasSteps = steps.some((s) => isDateInMonth(s.date, birthdateDate, i));
          const isFuture = i > currentAgeMonths;
          const isActive = i === selectedMonth;
          const label = getMonthPillLabel(i);
          const dateRange = getMonthPillDateRange(birthdateDate, i);

          return (
            <button
              key={i}
              data-month={i}
              onClick={() => !isFuture && onMonthSelect(i)}
              disabled={isFuture}
              className={cn(
                "flex-shrink-0 min-w-[130px] rounded-[2rem] p-4 cursor-pointer transition-all duration-200",
                isActive
                  ? "gradient-bg-vibrant text-white scale-105 shadow-[0_4px_20px_rgba(240,98,146,0.3)]"
                  : hasSteps
                    ? "bg-white border border-stone-100 text-stone-700 hover:border-rose-200"
                    : "bg-white border border-stone-100 text-stone-400",
                isFuture && "opacity-40 pointer-events-none"
              )}
            >
              <div
                className={cn(
                  "text-[10px] uppercase tracking-[0.2em] font-bold",
                  isActive ? "text-white/90" : "text-inherit"
                )}
              >
                {label}
              </div>
              <div
                className={cn("text-[11px] mt-0.5", isActive ? "text-white/70" : "text-stone-400")}
              >
                {dateRange}
              </div>
              <div
                className={cn(
                  "w-2 h-2 rounded-full mt-2",
                  isActive ? "bg-white/80" : hasSteps ? "gradient-bg" : "bg-stone-200"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
