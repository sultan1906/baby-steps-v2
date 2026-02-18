"use client";

import { useState, useEffect, useRef } from "react";
import { X, MapPin, Award, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { parseISO } from "date-fns";
import { getDayNumber, formatMemoryDate } from "@/lib/date-utils";
import { upsertDailyDescription, getDailyDescription } from "@/actions/daily-description";
import { useBaby } from "@/components/baby/baby-provider";
import type { Step } from "@/types";

interface StoryViewModalProps {
  steps: Step[];
  date: string;
  open: boolean;
  onClose: () => void;
}

export function StoryViewModal({ steps, date, open, onClose }: StoryViewModalProps) {
  const { baby } = useBaby();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [description, setDescription] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [draftDesc, setDraftDesc] = useState("");
  const [savingDesc, setSavingDesc] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentStep = steps[currentIndex];
  const dayNumber = getDayNumber(parseISO(baby.birthdate), parseISO(date));
  const dateLabel = formatMemoryDate(date);

  // Load daily description
  useEffect(() => {
    if (open) {
      getDailyDescription(baby.id, date).then((d) => {
        setDescription(d?.description ?? "");
        setDraftDesc(d?.description ?? "");
      });
    }
  }, [open, baby.id, date]);

  // Auto-advance timer
  useEffect(() => {
    if (!open || editingDesc) return;

    timerRef.current = setTimeout(() => {
      if (currentIndex < steps.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        onClose();
      }
    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, currentIndex, editingDesc, steps.length, onClose]);

  const prevStep = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const nextStep = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onClose();
    }
  };

  const handleSaveDesc = async () => {
    setSavingDesc(true);
    await upsertDailyDescription(baby.id, date, draftDesc);
    setDescription(draftDesc);
    setEditingDesc(false);
    setSavingDesc(false);
  };

  const handleCancelEdit = () => {
    setDraftDesc(description);
    setEditingDesc(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="story-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black"
      >
        {/* Blurred background */}
        {currentStep?.photoUrl && (
          <div className="absolute inset-0">
            <Image
              src={currentStep.photoUrl}
              alt=""
              fill
              className="object-cover blur-3xl opacity-50 scale-110"
            />
          </div>
        )}

        {/* Main container */}
        <div className="relative h-full flex flex-col max-w-lg mx-auto bg-stone-900">
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 px-4 pt-4">
            {steps.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: i < currentIndex ? "100%" : "0%" }}
                  animate={{
                    width: i < currentIndex ? "100%" : i === currentIndex ? "100%" : "0%",
                  }}
                  transition={
                    i === currentIndex ? { duration: 5, ease: "linear" } : { duration: 0 }
                  }
                  key={`${i}-${currentIndex}`}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="relative z-30 flex items-center justify-between px-4 py-3 mt-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {baby.name[0]}
              </div>
              <span className="text-sm text-white/70">
                Day {dayNumber} · {dateLabel}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Photo area */}
          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep?.id}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0"
              >
                {currentStep?.photoUrl ? (
                  <Image
                    src={currentStep.photoUrl}
                    alt={`Step ${currentIndex + 1}`}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full gradient-bg flex items-center justify-center">
                    <span className="text-6xl">🌱</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Tap zones */}
            <div className="absolute inset-y-0 left-0 w-[40%] cursor-pointer" onClick={prevStep} />
            <div className="absolute inset-y-0 right-0 w-[60%] cursor-pointer" onClick={nextStep} />

            {/* Desktop chevrons */}
            <button
              onClick={prevStep}
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full items-center justify-center text-white transition-colors"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextStep}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full items-center justify-center text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-6 pb-8 pt-20">
            {/* Tags row */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {currentStep?.isMajor && (
                <div className="flex items-center gap-1 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  <Award className="w-3 h-3" />
                  Milestone
                </div>
              )}
              {currentStep?.locationNickname && (
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                  <MapPin className="w-3 h-3" />
                  {currentStep.locationNickname}
                </div>
              )}
            </div>

            {/* Description */}
            {editingDesc ? (
              <div className="bg-black/60 backdrop-blur rounded-2xl p-4">
                <textarea
                  ref={textareaRef}
                  value={draftDesc}
                  onChange={(e) => setDraftDesc(e.target.value)}
                  rows={3}
                  autoFocus
                  placeholder="Write a memory note..."
                  className="w-full bg-transparent text-white text-base leading-relaxed resize-none focus:outline-none placeholder-white/40"
                />
                <div className="flex justify-between items-center mt-2">
                  <button onClick={handleCancelEdit} className="text-white/60 text-sm">
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDesc}
                    disabled={savingDesc}
                    className="gradient-text font-bold text-sm"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  setEditingDesc(true);
                  setDraftDesc(description);
                }}
                className="cursor-text"
              >
                {description ? (
                  <p className="italic text-white/80 text-base leading-relaxed">{description}</p>
                ) : (
                  <p className="text-white/40 text-base italic">+ Add a memory note...</p>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
