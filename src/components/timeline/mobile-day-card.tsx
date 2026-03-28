"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { parseISO, differenceInCalendarMonths } from "date-fns";
import { MoreHorizontal, Plus, Play, Eye, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { getDayNumber, formatShortDate, getMonthPillLabel } from "@/lib/date-utils";
import { deleteStep } from "@/actions/steps";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Step } from "@/types";

interface MobileDayCardProps {
  date: string;
  steps: Step[];
  birthdate: string;
  description?: string;
  readOnly?: boolean;
  onOpenStory: (date: string, steps: Step[]) => void;
}

function CardCarousel({
  steps,
  onTap,
  activeIndex,
  onActiveIndexChange,
}: {
  steps: Step[];
  onTap: () => void;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const didSwipe = useRef(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    onActiveIndexChange(idx);
  }, [onActiveIndexChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    touchStartX.current = e.clientX;
    didSwipe.current = false;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (Math.abs(e.clientX - touchStartX.current) > 10) {
      didSwipe.current = true;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!didSwipe.current) onTap();
  }, [onTap]);

  return (
    <>
      <div
        ref={scrollRef}
        role="button"
        tabIndex={0}
        aria-label="View day photos"
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTap();
          }
        }}
        className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        {steps.map((step) => (
          <div key={step.id} className="snap-center flex-shrink-0 w-full h-full relative">
            {step.photoUrl ? (
              step.type === "video" ? (
                <>
                  <video
                    src={step.photoUrl}
                    preload="metadata"
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </>
              ) : (
                <Image
                  src={step.photoUrl}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover"
                />
              )
            ) : (
              <div className="w-full h-full gradient-bg" />
            )}
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      {steps.length > 1 && (
        <div className="absolute bottom-3 right-14 flex gap-1.5 z-10">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                i === activeIndex ? "bg-white w-3" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function MobileDayCard({
  date,
  steps,
  birthdate,
  description,
  readOnly,
  onOpenStory,
}: MobileDayCardProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const birthdateDate = parseISO(birthdate);
  const dateDate = parseISO(date);
  const dayNumber = getDayNumber(birthdateDate, dateDate);
  const shortDate = formatShortDate(date);
  const monthIndex = differenceInCalendarMonths(dateDate, birthdateDate);
  const monthLabel = getMonthPillLabel(monthIndex);
  const hasMedia = steps.some((s) => s.photoUrl);
  const displayDescription = description || steps.find((s) => s.caption)?.caption;
  const activeStep = steps[activeIndex];
  const canDelete = !readOnly && activeStep?.photoUrl;

  // Empty state card (no media)
  if (!hasMedia) {
    return (
      <motion.div
        className="mb-4"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="relative rounded-3xl overflow-hidden bg-white/70 backdrop-blur-sm border border-stone-100/60 shadow-sm">
          {/* Date badge */}
          <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1 shadow-sm">
            <span className="text-xs font-semibold text-stone-600">{shortDate}</span>
          </div>

          <div className="px-4 pt-12 pb-4">
            <div className="text-2xl font-bold text-stone-800">{dayNumber} Days</div>
            <div className="text-xs text-stone-400 mt-0.5">
              {shortDate} &middot; {monthLabel}
            </div>

            {displayDescription && (
              <p className="text-sm text-stone-600 mt-2 leading-relaxed line-clamp-2">
                {displayDescription}
              </p>
            )}

            {!readOnly && (
              <button
                type="button"
                onClick={() => onOpenStory(date, steps)}
                className="mt-3 flex items-center gap-2 text-sm text-stone-400"
              >
                <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5 text-white" />
                </div>
                Tap to add a memory
              </button>
            )}
          </div>

          {/* Three-dot menu */}
          <div className="absolute top-3 right-3 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Day actions"
                className="p-1 text-stone-400 hover:text-stone-600 transition-colors rounded-full bg-white/80 backdrop-blur-sm"
              >
                <MoreHorizontal className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom">
                <DropdownMenuItem onClick={() => onOpenStory(date, steps)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View day
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>
    );
  }

  // Photo card
  return (
    <motion.div
      className="mb-4"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="relative rounded-3xl overflow-hidden shadow-sm aspect-[4/5]">
        {/* Photo carousel as background */}
        <CardCarousel
          steps={steps}
          onTap={() => onOpenStory(date, steps)}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
        />

        {/* Three-dot menu — top right */}
        <div className="absolute top-3 right-3 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Day actions"
              className="p-1.5 text-white/80 hover:text-white transition-colors rounded-full bg-black/20 backdrop-blur-sm"
            >
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom">
              <DropdownMenuItem onClick={() => onOpenStory(date, steps)}>
                <Eye className="w-4 h-4 mr-2" />
                View day
              </DropdownMenuItem>
              {canDelete && (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={async () => {
                    try {
                      await deleteStep(activeStep.id);
                      toast.success("Photo deleted");
                      router.refresh();
                    } catch {
                      toast.error("Failed to delete photo");
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete photo
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 z-[5] pointer-events-none bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-20 pb-4 px-4">
          <div className="text-2xl font-bold text-white">{dayNumber} Days</div>
          <div className="text-xs text-white/70 mt-0.5">
            {shortDate} &middot; {monthLabel}
          </div>
          {displayDescription && (
            <p className="text-sm text-white/80 mt-1.5 leading-relaxed line-clamp-2">
              {displayDescription}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
