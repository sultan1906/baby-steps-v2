"use client";

import { useState, useMemo } from "react";
import { parseISO } from "date-fns";
import { CalendarX2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TimelineHeader } from "@/components/timeline/timeline-header";
import { HorizontalMonthTimeline } from "@/components/timeline/horizontal-month-timeline";
import { DayCard } from "@/components/timeline/day-card";
import { StoryViewModal } from "@/components/timeline/story-view-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { getAgeInMonths, isDateInMonth } from "@/lib/date-utils";
import type { Step, Baby } from "@/types";

interface TimelineClientProps {
  steps: Step[];
  baby: Baby;
}

export function TimelineClient({ steps, baby }: TimelineClientProps) {
  const birthdateDate = parseISO(baby.birthdate);
  const currentAgeMonths = getAgeInMonths(birthdateDate);

  const [selectedMonth, setSelectedMonth] = useState(currentAgeMonths);
  const [storyDate, setStoryDate] = useState<string | null>(null);
  const [storySteps, setStorySteps] = useState<Step[]>([]);

  // Group steps by date for the selected month
  const dayGroups = useMemo(() => {
    const monthSteps = steps.filter((s) => isDateInMonth(s.date, birthdateDate, selectedMonth));

    // Group by date
    const grouped = new Map<string, Step[]>();
    for (const s of monthSteps) {
      const existing = grouped.get(s.date) ?? [];
      grouped.set(s.date, [...existing, s]);
    }

    // Sort by date
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [steps, baby.birthdate, selectedMonth]);

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
      {/* Sticky header */}
      <TimelineHeader />

      {/* Scrollable day cards area */}
      <div className="pb-[220px] pt-4">
        <AnimatePresence mode="wait">
          {dayGroups.length === 0 ? (
            <motion.div
              key={`empty-${selectedMonth}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <EmptyState
                icon={CalendarX2}
                title="No memories yet"
                description="Tap + to add your first memory for this month"
              />
            </motion.div>
          ) : (
            <motion.div
              key={`cards-${selectedMonth}`}
              className="flex gap-8 px-6 overflow-x-auto scrollbar-hide overscroll-x-contain py-4 min-w-max"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.07 } },
              }}
            >
              {dayGroups.map(([date, daySteps]) => (
                <motion.div
                  key={date}
                  variants={{
                    hidden: { opacity: 0, y: 24, scale: 0.96 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                >
                  <DayCard
                    date={date}
                    steps={daySteps}
                    birthdate={baby.birthdate}
                    onClick={() => openStory(date, daySteps)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed bottom: Month timeline */}
      <HorizontalMonthTimeline
        birthdate={baby.birthdate}
        steps={steps}
        selectedMonth={selectedMonth}
        onMonthSelect={setSelectedMonth}
      />

      {/* Story view modal */}
      {storyDate && (
        <StoryViewModal
          steps={storySteps}
          date={storyDate}
          open={!!storyDate}
          onClose={closeStory}
        />
      )}
    </div>
  );
}
