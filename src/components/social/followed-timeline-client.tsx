"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { parseISO } from "date-fns";
import { CalendarX2 } from "lucide-react";
import { FollowedTimelineHeader } from "./followed-timeline-header";
import { VerticalMonthSelector } from "@/components/timeline/vertical-month-selector";
import { MonthDivider } from "@/components/timeline/month-divider";
import { TimelineDayEntry } from "@/components/timeline/timeline-day-entry";
import { StoryViewModal } from "@/components/timeline/story-view-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentMonthIndex, getTotalMonths, isDateInMonth } from "@/lib/date-utils";
import type { Step, Baby } from "@/types";

interface FollowedTimelineClientProps {
  targetUser: { id: string; name: string; image: string | null };
  baby: Baby;
  steps: Step[];
  babies: { id: string; name: string; photoUrl: string | null; birthdate: string }[];
}

export function FollowedTimelineClient({
  targetUser,
  baby,
  steps,
  babies,
}: FollowedTimelineClientProps) {
  const birthdateDate = parseISO(baby.birthdate);
  const currentAgeMonths = getCurrentMonthIndex(birthdateDate);
  const totalMonths = getTotalMonths(birthdateDate);

  const [storyDate, setStoryDate] = useState<string | null>(null);
  const [storySteps, setStorySteps] = useState<Step[]>([]);
  const [activeMonth, setActiveMonth] = useState(currentAgeMonths);

  const monthRefs = useRef(new Map<number, HTMLElement>());
  const dayRefs = useRef(new Map<string, HTMLElement>());
  const isScrollingTo = useRef(false);
  const scrollingTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const searchParams = useSearchParams();
  const focusStepId = searchParams.get("stepId");
  const handledFocusRef = useRef<string | null>(null);

  const monthSections = useMemo(() => {
    const bd = parseISO(baby.birthdate);
    const sections: { monthIndex: number; dayGroups: [string, Step[]][] }[] = [];

    for (let m = 0; m < totalMonths; m++) {
      const monthSteps = steps.filter((s) => isDateInMonth(s.date, bd, m));
      if (monthSteps.length === 0) continue;

      const grouped = new Map<string, Step[]>();
      for (const s of monthSteps) {
        grouped.set(s.date, [...(grouped.get(s.date) ?? []), s]);
      }
      const sorted = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
      sections.push({ monthIndex: m, dayGroups: sorted });
    }

    return sections;
  }, [steps, baby.birthdate, totalMonths]);

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

  // Deep-link: scroll to the focused step's day (do not open the story modal).
  useEffect(() => {
    if (!focusStepId) return;
    if (handledFocusRef.current === focusStepId) return;
    const target = steps.find((s) => s.id === focusStepId);
    if (!target) return;
    handledFocusRef.current = focusStepId;
    requestAnimationFrame(() => {
      const el = dayRefs.current.get(target.date);
      if (!el) return;
      isScrollingTo.current = true;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (scrollingTimerRef.current) clearTimeout(scrollingTimerRef.current);
      scrollingTimerRef.current = setTimeout(() => {
        isScrollingTo.current = false;
      }, 800);
    });
  }, [focusStepId, steps]);

  const openStory = (date: string, daySteps: Step[]) => {
    setStoryDate(date);
    setStorySteps(daySteps);
  };

  const closeStory = () => {
    setStoryDate(null);
    setStorySteps([]);
  };

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
                <div
                  key={date}
                  ref={(el) => {
                    if (el) dayRefs.current.set(date, el);
                    else dayRefs.current.delete(date);
                  }}
                  data-day={date}
                  style={{ scrollMarginTop: 120 }}
                >
                  <TimelineDayEntry
                    date={date}
                    steps={daySteps}
                    birthdate={baby.birthdate}
                    isFirst={i === 0}
                    isLast={i === section.dayGroups.length - 1}
                    readOnly
                    onOpenStory={openStory}
                  />
                </div>
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
          readOnly
          baby={baby}
        />
      )}
    </div>
  );
}
