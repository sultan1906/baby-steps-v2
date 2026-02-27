"use client";

import { useState } from "react";
import { Grid3x3, List, Award, MapPin, Calendar } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { BackButton } from "@/components/shared/back-button";
import { EmptyState } from "@/components/shared/empty-state";
import { MemoryDetailModal } from "@/components/memory/memory-detail-modal";
import { cn } from "@/lib/utils";
import { formatShortDate, getDayNumber } from "@/lib/date-utils";
import { parseISO } from "date-fns";
import type { Step, Baby } from "@/types";

type ViewMode = "grid" | "list";
type Filter = "all" | "milestones";

interface GalleryClientProps {
  steps: Step[];
  baby: Baby;
}

export function GalleryClient({ steps, baby }: GalleryClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);

  const filtered = steps.filter((s) => {
    if (filter === "milestones") return s.isMajor;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-stone-100/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="font-bold text-stone-800 text-lg">Memory Gallery</h1>
          </div>
          {/* View toggle */}
          <div className="flex items-center bg-stone-50 rounded-xl p-1 gap-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                viewMode === "grid" ? "bg-white shadow text-stone-700" : "text-stone-400"
              )}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                viewMode === "list" ? "bg-white shadow text-stone-700" : "text-stone-400"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {(["all", "milestones"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                filter === f
                  ? "gradient-bg-vibrant text-white shadow"
                  : "bg-white border border-stone-200 text-stone-600"
              )}
            >
              {f === "all" ? "All" : "Milestones"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-28">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Grid3x3}
            title="No memories yet"
            description={
              filter === "milestones"
                ? "No milestones marked yet. Add memories and mark special ones!"
                : "Start adding memories to see them here."
            }
          />
        ) : viewMode === "grid" ? (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
          >
            {filtered.map((s) => (
              <motion.div
                key={s.id}
                variants={{
                  hidden: { opacity: 0, scale: 0.9 },
                  visible: { opacity: 1, scale: 1 },
                }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                onClick={() => setSelectedStep(s)}
                className="aspect-square rounded-3xl overflow-hidden relative group cursor-pointer"
              >
                {s.photoUrl ? (
                  s.type === "video" ? (
                    <video
                      src={s.photoUrl}
                      muted
                      autoPlay
                      playsInline
                      loop
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <Image
                      src={s.photoUrl}
                      alt={s.title ?? s.date}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      loading="eager"
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  )
                ) : (
                  <div className="w-full h-full gradient-bg" />
                )}
                {s.isMajor && (
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-2xl gradient-bg flex items-center justify-center shadow">
                    <Award className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            className="flex flex-col gap-3"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
          >
            {filtered.map((s) => (
              <motion.div
                key={s.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                onClick={() => setSelectedStep(s)}
                className="flex gap-4 bg-white rounded-3xl p-4 items-center border border-stone-100/50 cursor-pointer hover:border-rose-200 transition-colors"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden relative flex-shrink-0">
                  {s.photoUrl ? (
                    s.type === "video" ? (
                      <video
                        src={s.photoUrl}
                        muted
                        autoPlay
                        playsInline
                        loop
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <Image src={s.photoUrl} alt="" fill sizes="80px" className="object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full gradient-bg" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs bg-stone-50 text-stone-600 px-2 py-0.5 rounded-lg font-medium">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {formatShortDate(s.date)}
                    </span>
                    {s.isMajor && (
                      <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg font-medium">
                        Milestone
                      </span>
                    )}
                  </div>
                  {s.locationNickname && (
                    <div className="flex items-center gap-1 text-sm text-stone-500">
                      <MapPin className="w-3 h-3" />
                      {s.locationNickname}
                    </div>
                  )}
                  {s.caption && <p className="text-sm text-stone-600 mt-1 truncate">{s.caption}</p>}
                  <div className="text-xs text-stone-400 mt-1">
                    Day {getDayNumber(parseISO(baby.birthdate), parseISO(s.date))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Memory detail modal */}
      {selectedStep && (
        <MemoryDetailModal
          step={selectedStep}
          baby={baby}
          open={!!selectedStep}
          onClose={() => setSelectedStep(null)}
        />
      )}
    </div>
  );
}
