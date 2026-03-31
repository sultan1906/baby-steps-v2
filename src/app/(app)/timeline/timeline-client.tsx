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
  const scrollingTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Description lookup map
  const descriptionMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of descriptions) {
      map.set(d.date, d.description);
    }
    return map;
  }, [descriptions]);

  // Group ALL steps by month, then by date within each month
  // Union step dates with description-only dates so days with just a note still appear
  const monthSections = useMemo(() => {
    const sections: { monthIndex: number; dayGroups: [string, Step[]][] }[] = [];

    for (let m = 0; m < totalMonths; m++) {
      const monthSteps = steps.filter((s) => isDateInMonth(s.date, birthdateDate, m));

      // Collect description-only dates for this month
      const descDates = Array.from(descriptionMap.keys()).filter((d) =>
        isDateInMonth(d, birthdateDate, m)
      );

      if (monthSteps.length === 0 && descDates.length === 0) continue;

      const grouped = new Map<string, Step[]>();
      for (const s of monthSteps) {
        grouped.set(s.date, [...(grouped.get(s.date) ?? []), s]);
      }
      // Ensure description-only dates get an empty Step[] entry
      for (const d of descDates) {
        if (!grouped.has(d)) {
          grouped.set(d, []);
        }
      }
      const sorted = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
      sections.push({ monthIndex: m, dayGroups: sorted });
    }

    return sections;
  }, [steps, birthdateDate, totalMonths, descriptionMap]);

  // Flat dayGroups for StoryViewModal next-day navigation across months
  const allDayGroups = useMemo(() => monthSections.flatMap((s) => s.dayGroups), [monthSections]);

  // Total days since birth (for header display)
  const totalDays = getDayNumber(birthdateDate, new Date());

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
  // Scroll to a specific month section
  const scrollToMonth = useCallback((monthIndex: number) => {
    const el = monthRefs.current.get(monthIndex);
    if (!el) return;

    // Suppress observer during programmatic scroll
    isScrollingTo.current = true;
    setActiveMonth(monthIndex);
    el.scrollIntoView({ behavior: "smooth", block: "start" });

    // Clear any previous timer before setting a new one
    if (scrollingTimerRef.current) clearTimeout(scrollingTimerRef.current);
    scrollingTimerRef.current = setTimeout(() => {
      isScrollingTo.current = false;
    }, 800);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (scrollingTimerRef.current) clearTimeout(scrollingTimerRef.current);
    };
  }, []);

  // --- Timeline scrub/drag on green line ---
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrubStartY = useRef(0);
  const scrubStartScroll = useRef(0);
  const isScrubbing = useRef(false);
  const mouseCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => mouseCleanupRef.current?.(), []);

  // Multiplier: dragging the full visible height of the scrub zone
  // scrolls through the full document. This gives a natural scrollbar feel.
  const getScrubMultiplier = useCallback(() => {
    if (!timelineRef.current) return 3;
    const totalScrollable = document.documentElement.scrollHeight - window.innerHeight;
    const timelineHeight = timelineRef.current.offsetHeight;
    if (timelineHeight <= 0) return 3;
    return Math.max(1, totalScrollable / timelineHeight);
  }, []);

  const onScrubStart = useCallback((e: React.TouchEvent) => {
    isScrubbing.current = true;
    scrubStartY.current = e.touches[0].clientY;
    scrubStartScroll.current = window.scrollY;
  }, []);

  const onScrubMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isScrubbing.current) return;
      e.preventDefault();
      const deltaY = e.touches[0].clientY - scrubStartY.current;
      const multiplier = getScrubMultiplier();
      window.scrollTo(0, scrubStartScroll.current + deltaY * multiplier);
    },
    [getScrubMultiplier]
  );

  const onScrubEnd = useCallback(() => {
    isScrubbing.current = false;
  }, []);

  const onScrubMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isScrubbing.current = true;
      scrubStartY.current = e.clientY;
      scrubStartScroll.current = window.scrollY;

      const onMouseMove = (ev: MouseEvent) => {
        if (!isScrubbing.current) return;
        ev.preventDefault();
        const deltaY = ev.clientY - scrubStartY.current;
        const multiplier = getScrubMultiplier();
        window.scrollTo(0, scrubStartScroll.current + deltaY * multiplier);
      };

      const cleanupMouseListeners = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        mouseCleanupRef.current = null;
      };

      const onMouseUp = () => {
        isScrubbing.current = false;
        cleanupMouseListeners();
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      mouseCleanupRef.current = cleanupMouseListeners;
    },
    [getScrubMultiplier]
  );

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
          navigableMonths={new Set(monthSections.map((s) => s.monthIndex))}
          activeMonth={activeMonth}
          onMonthSelect={scrollToMonth}
          totalDays={totalDays}
        />
      </div>

      {/* Vertical timeline */}
      <div className="relative px-3 md:px-2 pb-28 pt-2" ref={timelineRef}>
        {monthSections.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title="No memories yet"
            description="Tap + to add your first memory"
          />
        ) : (
          <>
            {/* Scrub overlay on the green line area — pointer-events only for scrub gestures */}
            <div
              className="absolute left-0 top-0 bottom-0 w-14 z-20 cursor-grab active:cursor-grabbing"
              style={{ touchAction: "none" }}
              onTouchStart={onScrubStart}
              onTouchMove={onScrubMove}
              onTouchEnd={onScrubEnd}
              onMouseDown={onScrubMouseDown}
              onClick={(e) => e.stopPropagation()}
            />
            {monthSections.map((section) => (
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
                    description={descriptionMap.get(date)}
                    isFirst={i === 0}
                    isLast={i === section.dayGroups.length - 1}
                    onOpenStory={openStory}
                  />
                ))}
              </section>
            ))}
          </>
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
