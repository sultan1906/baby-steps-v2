"use client";

import { Grid3x3, Camera, Award, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { BackButton } from "@/components/shared/back-button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { getHeatmapWeeks } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { Step } from "@/types";

function getIntensity(count: number): 0 | 1 | 2 | 3 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  return 3;
}

const HEATMAP_STYLES: Record<0 | 1 | 2 | 3, string> = {
  0: "bg-stone-100",
  1: "gradient-bg opacity-30",
  2: "gradient-bg opacity-60",
  3: "gradient-bg",
};

interface DashboardClientProps {
  steps: Step[];
}

export function DashboardClient({ steps }: DashboardClientProps) {
  const photoCount = steps.filter((s) => s.type === "photo" || s.type === "video").length;
  const milestoneCount = steps.filter((s) => s.isMajor).length;
  const firstWordCount = steps.filter((s) => s.type === "first_word").length;

  // Heatmap data
  const heatmapWeeks = getHeatmapWeeks(steps);

  const statCards = [
    {
      icon: Grid3x3,
      label: "Total Memories",
      value: steps.length,
      color: "bg-rose-100 text-rose-500",
    },
    {
      icon: Camera,
      label: "Photos Captured",
      value: photoCount,
      color: "bg-amber-100 text-amber-500",
    },
    { icon: Award, label: "Milestones", value: milestoneCount, color: "bg-rose-50 text-rose-400" },
    {
      icon: MessageCircle,
      label: "First Words",
      value: firstWordCount,
      color: "bg-stone-100 text-stone-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-stone-100/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <BackButton />
          <h1 className="font-bold text-stone-800 text-lg">Journey Insights</h1>
        </div>
      </div>

      <div className="px-4 pb-28 space-y-4 pt-4">
        {/* Stats grid */}
        <motion.div
          className="grid grid-cols-2 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {statCards.map(({ icon: Icon, label, value, color }) => (
            <motion.div
              key={label}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="premium-card p-6 text-center"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3",
                  color
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-3xl font-bold text-stone-800 mb-1">{value}</div>
              <div className="text-xs text-stone-400">{label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Activity Heatmap */}
        <div className="premium-card p-6 mb-8">
          <p className="text-sm italic text-stone-400 mb-4">
            &ldquo;The days are long, but the years are short.&rdquo;
          </p>

          <TooltipProvider delay={300} closeDelay={0}>
            <div className="grid grid-cols-12 gap-1.5">
              {heatmapWeeks.map((week, i) => (
                <Tooltip key={i}>
                  <TooltipTrigger
                    aria-label={`${week.count === 0 ? "No memories" : `${week.count} ${week.count === 1 ? "memory" : "memories"}`}, ${format(week.start, "MMM d")} – ${format(week.end, "MMM d")}`}
                    className={cn(
                      "aspect-square w-full rounded-lg border-0 p-0 cursor-default",
                      HEATMAP_STYLES[getIntensity(week.count)]
                    )}
                  />
                  <TooltipContent side="top" sideOffset={6}>
                    <span className="font-medium">
                      {week.count === 0
                        ? "No memories"
                        : `${week.count} ${week.count === 1 ? "memory" : "memories"}`}
                    </span>
                    <br />
                    <span className="text-stone-400">
                      {format(week.start, "MMM d")} – {format(week.end, "MMM d")}
                    </span>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>

          <p className="text-xs text-stone-400 mt-3 text-right">Activity last 36 weeks</p>
        </div>
      </div>
    </div>
  );
}
