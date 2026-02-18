"use client";

import { Grid3x3, Camera, Award, MessageCircle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { BackButton } from "@/components/shared/back-button";
import { EmptyState } from "@/components/shared/empty-state";
import { getHeatmapWeeks } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { Step, Baby } from "@/types";

interface DashboardClientProps {
  steps: Step[];
  baby: Baby;
}

export function DashboardClient({ steps, baby }: DashboardClientProps) {
  const photoCount = steps.filter((s) => s.type === "photo" || s.type === "video").length;
  const milestoneCount = steps.filter((s) => s.isMajor).length;
  const firstWordCount = steps.filter((s) => s.type === "first_word").length;

  // Growth chart data
  const growthSteps = steps
    .filter((s) => s.type === "growth" && s.weight)
    .sort((a, b) => a.date.localeCompare(b.date));
  const maxWeight = Math.max(...growthSteps.map((s) => s.weight ?? 0), 0);

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

        {/* Growth Chart */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-bold text-stone-800">Growth Journey</h2>
          </div>

          {growthSteps.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No growth data yet"
              description="Add growth entries to track weight and height over time"
              className="py-8"
            />
          ) : (
            <div className="relative">
              <div className="flex items-end gap-3 h-[160px]">
                {growthSteps.map((s, i) => {
                  const heightPct = maxWeight > 0 ? (s.weight ?? 0) / maxWeight : 0;
                  const barHeight = Math.max(heightPct * 140, 8);
                  const isFirst = i === 0;
                  const label = isFirst ? "Arrival" : `Mo.${i}`;

                  return (
                    <div
                      key={s.id}
                      className="flex flex-col items-center flex-1 gap-1 group relative"
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {s.weight} kg
                      </div>
                      <div
                        className="w-full gradient-bg-vibrant rounded-t-xl min-h-[8px]"
                        style={{ height: barHeight }}
                      />
                      <span className="text-[10px] text-stone-400">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Activity Heatmap */}
        <div className="premium-card p-6 mb-8">
          <p className="text-sm italic text-stone-400 mb-4">
            &ldquo;The days are long, but the years are short.&rdquo;
          </p>

          <div className="grid grid-cols-12 gap-1.5">
            {heatmapWeeks.map((week, i) => (
              <div
                key={i}
                className={cn(
                  "aspect-square w-full rounded-lg",
                  week.hasActivity ? "gradient-bg" : "bg-stone-100"
                )}
                title={week.hasActivity ? "Active week" : "No activity"}
              />
            ))}
          </div>

          <p className="text-xs text-stone-400 mt-3 text-right">Activity last 36 weeks</p>
        </div>
      </div>
    </div>
  );
}
