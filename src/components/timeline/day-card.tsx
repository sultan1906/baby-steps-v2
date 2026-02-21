"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { parseISO } from "date-fns";
import { getDayNumber, formatShortDate } from "@/lib/date-utils";
import type { Step } from "@/types";

interface DayCardProps {
  date: string;
  steps: Step[];
  birthdate: string;
  onClick: () => void;
}

export function DayCard({ date, steps, birthdate, onClick }: DayCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const primaryStep = steps[0];

  useEffect(() => {
    setImageLoaded(false);
  }, [primaryStep?.photoUrl]);
  const hasMore = steps.length > 1;
  const isMajor = steps.some((s) => s.isMajor);
  const location = steps.find((s) => s.locationNickname)?.locationNickname;
  const dayNumber = getDayNumber(parseISO(birthdate), parseISO(date));
  const shortDate = formatShortDate(date);

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="relative w-[280px] aspect-[4/5] rounded-[3rem] overflow-hidden cursor-pointer flex-shrink-0 group"
    >
      {/* Background image */}
      {primaryStep?.photoUrl ? (
        <>
          {!imageLoaded && <div className="absolute inset-0 gradient-bg animate-pulse" />}
          <Image
            src={primaryStep.photoUrl}
            alt={`Day ${dayNumber}`}
            fill
            sizes="280px"
            loading="eager"
            onLoad={() => setImageLoaded(true)}
            className={`object-cover group-hover:scale-110 transition-transform duration-700 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          />
        </>
      ) : (
        <div className="w-full h-full gradient-bg" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Top-left: Milestone badge */}
      {isMajor && (
        <div className="absolute top-4 left-4 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1">
          Milestone
        </div>
      )}

      {/* Top-right: +N more badge */}
      {hasMore && (
        <div className="absolute top-4 right-4 bg-stone-900/60 text-white text-xs rounded-full px-2 py-1">
          +{steps.length - 1} more
        </div>
      )}

      {/* Bottom-left: Date + Day N */}
      <div className="absolute bottom-5 left-5">
        <div className="text-xs text-white/70 mb-0.5">{shortDate}</div>
        <div className="text-lg font-bold text-white">Day {dayNumber}</div>
      </div>

      {/* Bottom-right: Location pill */}
      {location && (
        <div className="absolute bottom-5 right-5 flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
          <MapPin className="w-3 h-3 text-white" />
          <span className="text-xs text-white">{location}</span>
        </div>
      )}
    </motion.div>
  );
}
