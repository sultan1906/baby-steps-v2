"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { parseISO } from "date-fns";
import { CalendarX2 } from "lucide-react";
import { TimelineHeader } from "@/components/timeline/timeline-header";
import { VerticalMonthSelector } from "@/components/timeline/vertical-month-selector";
import { MonthDivider } from "@/components/timeline/month-divider";
import { TimelineDayEntry } from "@/components/timeline/timeline-day-entry";
import { StoryViewModal } from "@/components/timeline/story-view-modal";
import { EmptyState } from "@/components/shared/empty-state";
import {
  getCurrentMonthIndex,
  getTotalMonths,
  isDateInMonth,
  getDayNumber,
} from "@/lib/date-utils";
import type { Step, Baby, DailyDescription } from "@/types";

interface TimelineClientProps {
  steps: Step[];
  baby: Baby;
  descriptions: DailyDescription[];
}

export function TimelineClient({ steps, baby, descriptions }: TimelineClientProps) {
  const birthdateDate = parseISO(baby.birthdate);
  const currentAgeMonths = getCurrentMonthIndex(birthdateDate);
  const totalMonths = getTotalMonths(birthdateDate);

  const [storyDate, setStoryDate] = useState<string | null>(null);
  const [storySteps, setStorySteps] = useState<Step[]>([]);
  const [activeMonth, setActiveMonth] = useState(currentAgeMonths);

  // Refs for each month section (scroll targets)
  const monthRefs = useRef(new Map<number, HTMLElement>());
  const isScrollingTo = useRef(false);

  // Description lookup map
  const descriptionMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of descriptions) {
      map.set(d.date, d.description);
    }
    return map;
  }, [descriptions]);

  // Group ALL steps by month, then by date within each month
  const monthSections = useMemo(() => {
    const sections: { monthIndex: number; dayGroups: [string, Step[]][] }[] = [];

    for (let m = 0; m < totalMonths; m++) {
      const monthSteps = steps.filter((s) => isDateInMonth(s.date, birthdateDate, m));
      if (monthSteps.length === 0) continue;

      const grouped = new Map<string, Step[]>();
      for (const s of monthSteps) {
        grouped.set(s.date, [...(grouped.get(s.date) ?? []), s]);
      }
      const sorted = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
      sections.push({ monthIndex: m, dayGroups: sorted });
    }

    return sections;
  }, [steps, birthdateDate, totalMonths]);

  // Flat dayGroups for StoryViewModal next-day navigation across months
  const allDayGroups = useMemo(() => monthSections.flatMap((s) => s.dayGroups), [monthSections]);

  // Total days since birth (for header display)
  const totalDays =
    steps.length > 0
      ? getDayNumber(birthdateDate, new Date())
      : getDayNumber(birthdateDate, new Date());

  // IntersectionObserver to detect which month is in view
  useEffect(() => {
    const visibleMonths = new Set<number>();

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingTo.current) return;

        for (const entry of entries) {
          const monthIdx = Number(entry.target.getAttribute("data-month-idx"));
          if (isNaN(monthIdx)) continue;
          if (entry.isIntersecting) {
            visibleMonths.add(monthIdx);
          } else {
            visibleMonths.delete(monthIdx);
          }
        }

        // Pick the topmost (smallest index) visible section
        if (visibleMonths.size > 0) {
          const topmost = Math.min(...visibleMonths);
          setActiveMonth(topmost);
        }
      },
      { rootMargin: "-120px 0px -40% 0px", threshold: 0 }
    );

    monthRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [monthSections]);

  // Scroll to a specific month section
  const scrollToMonth = useCallback((monthIndex: number) => {
    const el = monthRefs.current.get(monthIndex);
    if (!el) return;

    // Suppress observer during programmatic scroll
    isScrollingTo.current = true;
    setActiveMonth(monthIndex);
    el.scrollIntoView({ behavior: "smooth", block: "start" });

    // Re-enable observer after scroll settles
    const timer = setTimeout(() => {
      isScrollingTo.current = false;
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const openStory = (date: string, daySteps: Step[]) => {
    setStoryDate(date);
    setStorySteps(daySteps);
  };

  const closeStory = () => {
    setStoryDate(null);
    setStorySteps([]);
  };

  const goToNextDay = useCallback(() => {
    if (!storyDate) return;
    const idx = allDayGroups.findIndex(([d]) => d === storyDate);
    if (idx >= 0 && idx < allDayGroups.length - 1) {
      const [nextDate, nextSteps] = allDayGroups[idx + 1];
      setStoryDate(nextDate);
      setStorySteps(nextSteps);
    } else {
      closeStory();
    }
  }, [storyDate, allDayGroups]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header + month selector */}
      <div className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-stone-100/50">
        <TimelineHeader />
        <VerticalMonthSelector
          birthdate={baby.birthdate}
          steps={steps}
          activeMonth={activeMonth}
          onMonthSelect={scrollToMonth}
          totalDays={totalDays}
        />
      </div>

      {/* Vertical timeline */}
      <div className="px-2 pb-28 pt-2">
        {monthSections.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title="No memories yet"
            description="Tap + to add your first memory"
          />
        ) : (
          monthSections.map((section) => (
            <section
              key={section.monthIndex}
              ref={(el) => {
                if (el) monthRefs.current.set(section.monthIndex, el);
              }}
              data-month-idx={section.monthIndex}
            >
              <MonthDivider monthIndex={section.monthIndex} birthdate={baby.birthdate} />
              {section.dayGroups.map(([date, daySteps], i) => (
                <TimelineDayEntry
                  key={date}
                  date={date}
                  steps={daySteps}
                  birthdate={baby.birthdate}
                  monthIndex={section.monthIndex}
                  description={descriptionMap.get(date)}
                  isLast={i === section.dayGroups.length - 1}
                  onOpenStory={openStory}
                />
              ))}
            </section>
          ))
        )}
      </div>

      {/* Story view modal */}
      {storyDate && (
        <StoryViewModal
          steps={storySteps}
          date={storyDate}
          open={!!storyDate}
          onClose={closeStory}
          onNextDay={goToNextDay}
        />
      )}
    </div>
  );
}
