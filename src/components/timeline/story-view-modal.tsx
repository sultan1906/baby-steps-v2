"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { X, MapPin, Award, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { parseISO } from "date-fns";
import { getDayNumber, formatMemoryDate } from "@/lib/date-utils";
import { upsertDailyDescription, getDailyDescription } from "@/actions/daily-description";
import { deleteStep } from "@/actions/steps";
import { toast } from "sonner";
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
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());
  const localSteps = useMemo(() => steps.filter((s) => !deletedIds.has(s.id)), [steps, deletedIds]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [description, setDescription] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [draftDesc, setDraftDesc] = useState("");
  const [savingDesc, setSavingDesc] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const confirmDelete = pendingDeleteId !== null;
  const [deleting, setDeleting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentStep = localSteps[currentIndex];
  const dayNumber = getDayNumber(parseISO(baby.birthdate), parseISO(date));
  const dateLabel = formatMemoryDate(date);

  // Load daily description and reset navigation state
  useEffect(() => {
    if (!open) return;
    getDailyDescription(baby.id, date).then((d) => {
      setDeletedIds(new Set());
      setCurrentIndex(0);
      setPendingDeleteId(null);
      setDescription(d?.description ?? "");
      setDraftDesc(d?.description ?? "");
    });
  }, [open, baby.id, date]);

  // Auto-advance timer
  useEffect(() => {
    if (!open || editingDesc || confirmDelete) return;

    // Don't auto-advance on video steps — let the user control playback
    if (currentStep?.type === "video") return;

    timerRef.current = setTimeout(() => {
      if (currentIndex < localSteps.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        onClose();
      }
    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    open,
    currentIndex,
    editingDesc,
    confirmDelete,
    localSteps.length,
    onClose,
    currentStep?.type,
  ]);

  const prevStep = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const nextStep = () => {
    if (currentIndex < localSteps.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try {
      await deleteStep(pendingDeleteId);
      const updated = localSteps.filter((s) => s.id !== pendingDeleteId);
      if (updated.length === 0) {
        onClose();
      } else {
        setDeletedIds((prev) => new Set([...prev, pendingDeleteId]));
        setCurrentIndex(Math.min(currentIndex, updated.length - 1));
      }
    } catch (err) {
      console.error("Failed to delete step:", err);
      toast.error("Failed to delete photo. Please try again.");
    } finally {
      setPendingDeleteId(null);
      setDeleting(false);
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
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Blurred background */}
        {currentStep?.photoUrl && (
          <div className="absolute inset-0 pointer-events-none">
            {currentStep.type === "video" ? (
              <video
                src={currentStep.photoUrl}
                muted
                autoPlay
                playsInline
                loop
                className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-50 scale-110"
              />
            ) : (
              <Image
                src={currentStep.photoUrl}
                alt=""
                fill
                sizes="100vw"
                className="object-cover blur-3xl opacity-50 scale-110"
              />
            )}
          </div>
        )}

        {/* Main container */}
        <div className="relative h-full flex flex-col max-w-lg mx-auto bg-stone-900">
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 px-4 pt-4">
            {localSteps.map((s, i) => (
              <div key={s.id} className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
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
            <div className="flex items-center gap-2">
              <button
                aria-label="Delete photo"
                onClick={() => setPendingDeleteId(currentStep?.id ?? null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                aria-label="Close"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Photo area — clicking background closes */}
          <div className="flex-1 relative overflow-hidden" onClick={onClose}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep?.id}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 pointer-events-none"
              >
                {currentStep?.photoUrl ? (
                  currentStep.type === "video" ? (
                    <video
                      src={currentStep.photoUrl}
                      controls
                      playsInline
                      className="absolute inset-0 w-full h-full object-contain pointer-events-auto"
                    />
                  ) : (
                    <Image
                      src={currentStep.photoUrl}
                      alt={`Step ${currentIndex + 1}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 512px"
                      className="object-contain"
                    />
                  )
                ) : (
                  <div className="w-full h-full gradient-bg flex items-center justify-center">
                    <span className="text-6xl">🌱</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Tap zones — leaving top/bottom edges as close zones */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Previous"
              className="absolute top-[10%] bottom-[10%] left-0 w-[40%] cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                prevStep();
              }}
              onKeyDown={(e) => e.key === "Enter" && prevStep()}
            />
            <div
              role="button"
              tabIndex={0}
              aria-label="Next"
              className="absolute top-[10%] bottom-[10%] right-0 w-[60%] cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                nextStep();
              }}
              onKeyDown={(e) => e.key === "Enter" && nextStep()}
            />

            {/* Desktop chevrons */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevStep();
              }}
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full items-center justify-center text-white transition-colors"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextStep();
              }}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full items-center justify-center text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Delete confirmation banner */}
          {confirmDelete && (
            <div className="absolute bottom-0 left-0 right-0 z-40 bg-black/95 px-6 py-5 flex items-center justify-between">
              <span className="text-white text-sm">Delete this photo?</span>
              <div className="flex gap-4">
                <button onClick={() => setPendingDeleteId(null)} className="text-white/60 text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-400 font-bold text-sm"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          )}

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
                role="button"
                tabIndex={0}
                onClick={() => {
                  setEditingDesc(true);
                  setDraftDesc(description);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setEditingDesc(true);
                    setDraftDesc(description);
                  }
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
