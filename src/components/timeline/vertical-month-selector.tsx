"use client";

import { useEffect, useRef } from "react";
import { parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getTotalMonths,
  getMonthPillLabel,
  isDateInMonth,
  getCurrentMonthIndex,
} from "@/lib/date-utils";
import type { Step } from "@/types";

interface VerticalMonthSelectorProps {
  birthdate: string;
  steps: Step[];
  activeMonth: number;
  onMonthSelect: (monthIndex: number) => void;
  totalDays: number;
}

export function VerticalMonthSelector({
  birthdate,
  steps,
  activeMonth,
  onMonthSelect,
  totalDays,
}: VerticalMonthSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const birthdateDate = parseISO(birthdate);
  const totalMonths = getTotalMonths(birthdateDate);
  const currentAgeMonths = getCurrentMonthIndex(birthdateDate);

  // Auto-scroll active month pill into view
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const pill = container.querySelector(`[data-month="${activeMonth}"]`) as HTMLElement;
    if (!pill) return;
    pill.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeMonth]);

  return (
    <div>
      <div
        ref={scrollRef}
        className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto scrollbar-hide overscroll-x-contain"
      >
        {Array.from({ length: totalMonths }, (_, i) => {
          const hasSteps = steps.some((s) => isDateInMonth(s.date, birthdateDate, i));
          const isFuture = i > currentAgeMonths;
          const isActive = i === activeMonth;
          const label = getMonthPillLabel(i);
          const isCurrent = i === currentAgeMonths;

          return (
            <button
              key={i}
              data-month={i}
              onClick={() => !isFuture && onMonthSelect(i)}
              disabled={isFuture}
              className={cn(
                "flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap",
                isActive
                  ? "gradient-bg-vibrant text-white shadow-[0_2px_12px_rgba(240,98,146,0.25)]"
                  : hasSteps
                    ? "bg-white border border-stone-200 text-stone-600 hover:border-rose-200"
                    : "bg-white border border-stone-100 text-stone-400",
                isFuture && "opacity-40 pointer-events-none"
              )}
            >
              {label}
              {isCurrent ? " (Current)" : ""}
            </button>
          );
        })}
      </div>
      <div className="text-center text-[11px] text-stone-400 pb-2">{totalDays} days total</div>
    </div>
  );
}
