"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { parseISO } from "date-fns";
import { CalendarX2 } from "lucide-react";
import { FollowedTimelineHeader } from "./followed-timeline-header";
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

interface FollowedTimelineClientProps {
  targetUser: { id: string; name: string; image: string | null };
  baby: Baby;
  steps: Step[];
  descriptions: DailyDescription[];
  babies: { id: string; name: string; photoUrl: string | null; birthdate: string }[];
}

export function FollowedTimelineClient({
  targetUser,
  baby,
  steps,
  descriptions,
  babies,
}: FollowedTimelineClientProps) {
  const birthdateDate = parseISO(baby.birthdate);
  const currentAgeMonths = getCurrentMonthIndex(birthdateDate);
  const totalMonths = getTotalMonths(birthdateDate);

  const [storyDate, setStoryDate] = useState<string | null>(null);
  const [storySteps, setStorySteps] = useState<Step[]>([]);
  const [activeMonth, setActiveMonth] = useState(currentAgeMonths);

  const monthRefs = useRef(new Map<number, HTMLElement>());
  const isScrollingTo = useRef(false);
  const scrollingTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const descriptionMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of descriptions) {
      map.set(d.date, d.description);
    }
    return map;
  }, [descriptions]);

  const monthSections = useMemo(() => {
    const sections: { monthIndex: number; dayGroups: [string, Step[]][] }[] = [];

    for (let m = 0; m < totalMonths; m++) {
      const monthSteps = steps.filter((s) => isDateInMonth(s.date, birthdateDate, m));
      const descDates = Array.from(descriptionMap.keys()).filter((d) =>
        isDateInMonth(d, birthdateDate, m)
      );

      if (monthSteps.length === 0 && descDates.length === 0) continue;

      const grouped = new Map<string, Step[]>();
      for (const s of monthSteps) {
        grouped.set(s.date, [...(grouped.get(s.date) ?? []), s]);
      }
      for (const d of descDates) {
        if (!grouped.has(d)) grouped.set(d, []);
      }
      const sorted = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
      sections.push({ monthIndex: m, dayGroups: sorted });
    }

    return sections;
  }, [steps, birthdateDate, totalMonths, descriptionMap]);

  const allDayGroups = useMemo(() => monthSections.flatMap((s) => s.dayGroups), [monthSections]);
  const totalDays = getDayNumber(birthdateDate, new Date());

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

  const scrollToMonth = useCallback((monthIndex: number) => {
    const el = monthRefs.current.get(monthIndex);
    if (!el) return;

    isScrollingTo.current = true;
    setActiveMonth(monthIndex);
    el.scrollIntoView({ behavior: "smooth", block: "start" });

    if (scrollingTimerRef.current) clearTimeout(scrollingTimerRef.current);
    scrollingTimerRef.current = setTimeout(() => {
      isScrollingTo.current = false;
    }, 800);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollingTimerRef.current) clearTimeout(scrollingTimerRef.current);
    };
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
        <FollowedTimelineHeader
          userName={targetUser.name}
          userImage={targetUser.image}
          userId={targetUser.id}
          baby={baby}
          babies={babies}
        />
        <VerticalMonthSelector
          birthdate={baby.birthdate}
          navigableMonths={new Set(monthSections.map((s) => s.monthIndex))}
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
            description="This baby doesn't have any memories yet"
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
                  readOnly
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
          readOnly
        />
      )}
    </div>
  );
}
