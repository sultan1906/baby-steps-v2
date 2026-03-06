"use client";

import { parseISO } from "date-fns";
import { getMonthPillLabel, getMonthPillDateRange, getCurrentMonthIndex } from "@/lib/date-utils";

interface MonthDividerProps {
  monthIndex: number;
  birthdate: string;
}

export function MonthDivider({ monthIndex, birthdate }: MonthDividerProps) {
  const birthdateDate = parseISO(birthdate);
  const label = getMonthPillLabel(monthIndex);
  const dateRange = getMonthPillDateRange(birthdateDate, monthIndex);
  const isCurrent = monthIndex === getCurrentMonthIndex(birthdateDate);

  return (
    <div className="flex items-center gap-3 px-4 pt-6 pb-3">
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold ${isCurrent ? "gradient-text" : "text-stone-700"}`}>
          {label}
        </span>
        {isCurrent && (
          <span className="text-[10px] font-medium text-rose-400 bg-rose-50 rounded-full px-2 py-0.5">
            Current
          </span>
        )}
      </div>
      <div className="flex-1 h-px bg-stone-200" />
      <span className="text-[11px] text-stone-400">{dateRange}</span>
    </div>
  );
}
