"use client";

import { useState } from "react";
import { Grid3x3, Camera, Award, MessageCircle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { BackButton } from "@/components/shared/back-button";
import { EmptyState } from "@/components/shared/empty-state";
import { getHeatmapWeeks, getAgeInMonths } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { Step } from "@/types";

interface DashboardClientProps {
  steps: Step[];
  babyBirthdate: string;
}

export function DashboardClient({ steps, babyBirthdate }: DashboardClientProps) {
  const photoCount = steps.filter((s) => s.type === "photo" || s.type === "video").length;
  const milestoneCount = steps.filter((s) => s.isMajor).length;
  const firstWordCount = steps.filter((s) => s.type === "first_word").length;

  // Growth chart data
  const birthDate = new Date(babyBirthdate);
  const growthSteps = steps
    .filter((s) => s.type === "growth" && s.weight)
    .sort((a, b) => a.date.localeCompare(b.date));
  const hasHeightData = growthSteps.some((s) => s.height);

  // Compute actual month age for each entry
  const stepMonths = growthSteps.map((s) => getAgeInMonths(birthDate, new Date(s.date)));
  const currentMonth = getAgeInMonths(birthDate);
  const maxMonth = Math.max(...stepMonths, currentMonth);
  const totalMonths = Math.max(maxMonth, 1);
  // All month ticks from 0 to totalMonths
  const monthTicks = Array.from({ length: totalMonths + 1 }, (_, i) => i);

  // Chart geometry
  const chartW = 320;
  const chartH = 110;
  const padTop = 16;
  const padBottom = 18;
  const padX = 16;
  const plotW = chartW - padX * 2;
  const plotH = chartH - padTop - padBottom;

  // X position by month number
  const monthToX = (m: number) => padX + (totalMonths === 0 ? plotW / 2 : (m / totalMonths) * plotW);

  // Value ranges with 10% padding so dots don't touch edges
  const weights = growthSteps.map((s) => s.weight ?? 0);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const wRange = maxW - minW || 1;
  const wPad = wRange * 0.1;

  const heights = growthSteps.map((s) => s.height ?? 0).filter(Boolean);
  const minH = heights.length ? Math.min(...heights) : 0;
  const maxH = heights.length ? Math.max(...heights) : 0;
  const hRange = maxH - minH || 1;
  const hPad = hRange * 0.1;

  const toYWeight = (v: number) =>
    padTop + plotH - ((v - (minW - wPad)) / (wRange + wPad * 2)) * plotH;
  const toYHeight = (v: number) =>
    padTop + plotH - ((v - (minH - hPad)) / (hRange + hPad * 2)) * plotH;

  const weightPoints = growthSteps.map((s, i) => ({
    x: monthToX(stepMonths[i]),
    y: toYWeight(s.weight ?? 0),
    month: stepMonths[i],
  }));
  const heightPoints = growthSteps
    .map((s, i) =>
      s.height
        ? { x: monthToX(stepMonths[i]), y: toYHeight(s.height), val: s.height, month: stepMonths[i] }
        : null
    )
    .filter(Boolean) as { x: number; y: number; val: number; month: number }[];

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
        <div className="premium-card p-5">
          <div className="flex items-center gap-2 mb-3">
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
            <GrowthChart
              growthSteps={growthSteps}
              hasHeightData={hasHeightData}
              chartW={chartW}
              chartH={chartH}
              padTop={padTop}
              padX={padX}
              plotH={plotH}
              monthToX={monthToX}
              monthTicks={monthTicks}
              weightPoints={weightPoints}
              heightPoints={heightPoints}
            />
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

/* ─── Growth chart with weight/height toggle ─────────────────────────── */

function GrowthChart({
  growthSteps,
  hasHeightData,
  chartW,
  chartH,
  padTop,
  padX,
  plotH,
  monthToX,
  monthTicks,
  weightPoints,
  heightPoints,
}: {
  growthSteps: Step[];
  hasHeightData: boolean;
  chartW: number;
  chartH: number;
  padTop: number;
  padX: number;
  plotH: number;
  monthToX: (m: number) => number;
  monthTicks: number[];
  weightPoints: { x: number; y: number; month: number }[];
  heightPoints: { x: number; y: number; val: number; month: number }[];
}) {
  const [metric, setMetric] = useState<"weight" | "height">("weight");
  const showWeight = metric === "weight";
  const color = showWeight ? "#F06292" : "#FFB74D";
  const unit = showWeight ? "kg" : "cm";

  const points = showWeight ? weightPoints : heightPoints;
  const values = showWeight
    ? growthSteps.map((s) => s.weight ?? 0)
    : heightPoints.map((p) => p.val);

  // Skip some tick labels if there are too many months to avoid overlap
  const tickStep = monthTicks.length > 12 ? 3 : monthTicks.length > 6 ? 2 : 1;

  return (
    <>
      {/* Toggle */}
      {hasHeightData && (
        <div className="flex bg-stone-100 rounded-2xl p-1 mb-4">
          <button
            onClick={() => setMetric("weight")}
            className={`flex-1 py-2 rounded-[0.875rem] text-sm font-medium transition-all ${
              showWeight ? "bg-white text-stone-800 shadow-sm" : "text-stone-400"
            }`}
          >
            Weight (kg)
          </button>
          <button
            onClick={() => setMetric("height")}
            className={`flex-1 py-2 rounded-[0.875rem] text-sm font-medium transition-all ${
              !showWeight ? "bg-white text-stone-800 shadow-sm" : "text-stone-400"
            }`}
          >
            Height (cm)
          </button>
        </div>
      )}

      {/* No height data message */}
      {!showWeight && heightPoints.length === 0 ? (
        <p className="text-sm text-stone-400 text-center py-8">
          No height data recorded yet
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Vertical tick lines for each month */}
          {monthTicks.map((m) => (
            <line
              key={`tick-${m}`}
              x1={monthToX(m)}
              y1={padTop}
              x2={monthToX(m)}
              y2={padTop + plotH}
              stroke="#e7e5e4"
              strokeWidth="0.5"
              strokeDasharray={m === 0 ? "none" : "3 3"}
            />
          ))}

          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75].map((pct) => {
            const y = padTop + plotH * (1 - pct);
            return (
              <line
                key={pct}
                x1={padX}
                y1={y}
                x2={chartW - padX}
                y2={y}
                stroke="#e7e5e4"
                strokeDasharray="4 4"
                strokeWidth="0.5"
              />
            );
          })}

          {/* Line */}
          {points.length > 1 && (
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points.map((p) => `${p.x},${p.y}`).join(" ")}
            />
          )}

          {/* Dots + value labels */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3" fill={color} />
              <text
                x={p.x}
                y={p.y - 8}
                textAnchor="middle"
                fill="#57534e"
                fontSize="7"
                fontWeight="600"
              >
                {values[i]} {unit}
              </text>
            </g>
          ))}

          {/* X-axis month labels */}
          {monthTicks
            .filter((m) => m % tickStep === 0)
            .map((m) => (
              <text
                key={`label-${m}`}
                x={monthToX(m)}
                y={chartH - 6}
                textAnchor="middle"
                fill="#a8a29e"
                fontSize="7"
              >
                {m === 0 ? "Birth" : `${m}m`}
              </text>
            ))}
        </svg>
      )}
    </>
  );
}
