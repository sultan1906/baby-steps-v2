"use client";

import { useRef, useState, useEffect } from "react";
import { X, MapPin, Calendar, Share2, Award, Play, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { parseISO } from "date-fns";
import { getDayNumber, formatMemoryDate } from "@/lib/date-utils";
import type { Step, Baby } from "@/types";

interface MemoryDetailModalProps {
  step: Step;
  baby: Baby;
  open: boolean;
  onClose: () => void;
}

export function MemoryDetailModal({ step, baby, open, onClose }: MemoryDetailModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const isVideo = step.type === "video";

  useEffect(() => {
    if (!open || !isVideo) return;
    setIsVideoMuted(true);
    setIsVideoPaused(false);
  }, [open, step.id, isVideo]);

  const handleVideoTap = () => {
    const vid = videoRef.current;
    if (!vid) return;

    if (vid.muted) {
      vid.muted = false;
      setIsVideoMuted(false);
      return;
    }

    if (vid.paused) {
      vid.play();
      setIsVideoPaused(false);
    } else {
      vid.pause();
      setIsVideoPaused(true);
    }
  };

  if (!open) return null;

  const dayNumber = getDayNumber(parseISO(baby.birthdate), parseISO(step.date));
  const dateLabel = formatMemoryDate(step.date);

  const handleShare = () => {
    const text = `${baby.name}'s memory on Day ${dayNumber} — ${dateLabel}${step.caption ? `\n"${step.caption}"` : ""}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-white rounded-[2.5rem] overflow-hidden max-h-[90vh] overflow-y-auto relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Photo/video area */}
          <div
            className="relative aspect-[4/3] overflow-hidden"
            onClick={isVideo ? handleVideoTap : undefined}
          >
            {step.photoUrl ? (
              step.type === "video" ? (
                <video
                  ref={videoRef}
                  src={step.photoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={step.photoUrl}
                  alt={dateLabel}
                  fill
                  sizes="(max-width: 768px) 100vw, 672px"
                  className="object-cover"
                />
              )
            ) : (
              <div className="w-full h-full gradient-bg" />
            )}
            {/* Video indicators */}
            {isVideo && (
              <>
                {isVideoMuted && !isVideoPaused && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <VolumeX className="w-3.5 h-3.5 text-white" />
                    <span className="text-xs text-white font-medium">Tap for sound</span>
                  </div>
                )}
                {isVideoPaused && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                  </div>
                )}
              </>
            )}
            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/20 to-transparent" />

            {/* Day pill */}
            <div className="absolute bottom-4 left-6 gradient-bg text-white text-sm font-bold px-4 py-1.5 rounded-full">
              Day {dayNumber}
            </div>
            {/* Milestone badge */}
            {step.isMajor && (
              <div className="absolute bottom-4 right-6 bg-amber-100 text-amber-800 text-sm font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                Milestone
              </div>
            )}
          </div>

          {/* Content */}
          <div className="px-8 sm:px-10 py-6">
            {/* Tags */}
            <div className="flex gap-2 flex-wrap mb-4">
              {step.locationNickname && (
                <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-2xl px-3 py-1.5 text-sm text-stone-600">
                  <MapPin className="w-3.5 h-3.5" />
                  {step.locationNickname}
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-2xl px-3 py-1.5 text-sm text-stone-600">
                <Calendar className="w-3.5 h-3.5" />
                {dateLabel}
              </div>
            </div>

            {/* Caption */}
            {step.caption && (
              <div className="mb-4">
                <span className="text-6xl text-rose-200 font-serif leading-none block -mb-4">
                  &ldquo;
                </span>
                <p className="text-xl italic text-stone-700 leading-relaxed pl-6">{step.caption}</p>
              </div>
            )}

            {/* Growth data */}
            {step.type === "growth" && step.weight && (
              <div className="bg-white border border-stone-100 rounded-2xl p-4 flex gap-6 mb-4">
                <div className="flex items-center gap-2 text-stone-700">
                  <span className="text-sm font-medium text-stone-500">Weight</span>
                  <span className="font-bold">{step.weight} kg</span>
                </div>
                {step.height && (
                  <div className="flex items-center gap-2 text-stone-700">
                    <span className="text-sm font-medium text-stone-500">Height</span>
                    <span className="font-bold">{step.height} cm</span>
                  </div>
                )}
              </div>
            )}

            {/* First word */}
            {step.type === "first_word" && step.firstWord && (
              <div className="bg-rose-50 rounded-2xl p-6 text-center mb-4">
                <span className="text-4xl text-rose-300 font-serif">&ldquo;</span>
                <p className="text-3xl italic gradient-text font-bold">{step.firstWord}</p>
                <span className="text-4xl text-rose-300 font-serif">&rdquo;</span>
                <p className="text-xs text-stone-400 mt-1">First word</p>
              </div>
            )}
          </div>

          {/* Sticky share button */}
          <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-stone-100 p-4">
            <button
              onClick={handleShare}
              className="gradient-bg-vibrant w-full py-3.5 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share Memory
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
