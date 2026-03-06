"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Play, Ruler } from "lucide-react";
import type { Step } from "@/types";

interface DayPhotoCarouselProps {
  steps: Step[];
  onTap: () => void;
}

export function DayPhotoCarousel({ steps, onTap }: DayPhotoCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(idx);
  }, []);

  return (
    <div className="max-w-[240px]">
      <div
        ref={scrollRef}
        role="button"
        tabIndex={0}
        aria-label="View day photos"
        onScroll={handleScroll}
        onClick={onTap}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTap();
          }
        }}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide rounded-xl cursor-pointer"
      >
        {steps.map((step) => (
          <div key={step.id} className="snap-center flex-shrink-0 w-full">
            {step.photoUrl ? (
              step.type === "video" ? (
                <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100">
                  <video
                    src={step.photoUrl}
                    preload="metadata"
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100">
                  <Image src={step.photoUrl} alt="" fill sizes="240px" className="object-cover" />
                </div>
              )
            ) : step.type === "growth" ? (
              <div className="aspect-square rounded-xl overflow-hidden gradient-bg flex flex-col items-center justify-center gap-1.5">
                <Ruler className="w-7 h-7 text-white/80" />
                <div className="text-white font-bold text-base">{step.weight} kg</div>
                {step.height && <div className="text-white/70 text-xs">{step.height} cm</div>}
                <div className="text-white/50 text-[10px] font-medium mt-0.5">Growth Check-in</div>
              </div>
            ) : (
              <div className="aspect-square rounded-xl overflow-hidden gradient-bg" />
            )}
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      {steps.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                i === activeIndex ? "gradient-bg w-3" : "bg-stone-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
