"use client";

import { useRef, useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";
import {
  X,
  Award,
  Loader2,
  MapPin,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { todayString } from "@/lib/date-utils";
import type { UploadQueueItem } from "@/types";

const MAX_CAPTION_LENGTH = 2000;
const CAPTION_COUNTER_THRESHOLD = 1800;

interface PhotoEditorPagerProps {
  queue: UploadQueueItem[];
  onQueueChange: Dispatch<SetStateAction<UploadQueueItem[]>>;
  onAddMore: () => void;
  onOpenLocationPicker: (itemId: string) => void;
  babyBirthdate: string;
  /** Lifted into the parent so it survives temporary unmounts (mobile location picker). */
  activeIndex: number;
  onActiveIndexChange: (idx: number) => void;
}

export function PhotoEditorPager({
  queue,
  onQueueChange,
  onAddMore,
  onOpenLocationPicker,
  babyBirthdate,
  activeIndex,
  onActiveIndexChange,
}: PhotoEditorPagerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipNextScrollSync = useRef(false);
  const previousQueueLength = useRef(queue.length);

  const scrollToIndex = useCallback((idx: number, behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const rawIdx = Math.round(el.scrollLeft / el.clientWidth);
    const idx = Math.max(0, Math.min(queue.length - 1, rawIdx));
    if (idx === activeIndex) return;
    // The next activeIndex change is internal — don't re-scroll to it.
    skipNextScrollSync.current = true;
    onActiveIndexChange(idx);
  }, [activeIndex, onActiveIndexChange, queue.length]);

  // Sync scroll position to controlled activeIndex (mount, arrow click, thumbnail click,
  // dot click, queue mutations, parent restores after temporary unmount).
  useEffect(() => {
    if (skipNextScrollSync.current) {
      skipNextScrollSync.current = false;
      return;
    }
    const r = requestAnimationFrame(() => scrollToIndex(activeIndex, "auto"));
    return () => cancelAnimationFrame(r);
  }, [activeIndex, scrollToIndex]);

  // Queue length changes: shift activeIndex to first new page or clamp to last.
  useEffect(() => {
    if (queue.length > previousQueueLength.current) {
      onActiveIndexChange(previousQueueLength.current);
    } else if (queue.length < previousQueueLength.current) {
      const clamped = Math.min(activeIndex, Math.max(0, queue.length - 1));
      if (clamped !== activeIndex) onActiveIndexChange(clamped);
    }
    previousQueueLength.current = queue.length;
  }, [queue.length, activeIndex, onActiveIndexChange]);

  const updateItem = (id: string, patch: Partial<UploadQueueItem>) => {
    onQueueChange((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const removeItem = (id: string) => {
    const target = queue.find((i) => i.id === id);
    target?.controller?.abort();
    if (target?.objectUrl) URL.revokeObjectURL(target.objectUrl);
    onQueueChange((prev) => prev.filter((i) => i.id !== id));
  };

  const goPrev = () => {
    if (activeIndex > 0) onActiveIndexChange(activeIndex - 1);
  };
  const goNext = () => {
    if (activeIndex < queue.length - 1) onActiveIndexChange(activeIndex + 1);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-6 px-6"
        >
          {queue.map((item) => (
            <PhotoEditorPage
              key={item.id}
              item={item}
              babyBirthdate={babyBirthdate}
              onUpdate={(patch) => updateItem(item.id, patch)}
              onRemove={() => removeItem(item.id)}
              onOpenLocationPicker={() => onOpenLocationPicker(item.id)}
            />
          ))}
        </div>

        {/* Desktop arrows */}
        {queue.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={goPrev}
              disabled={activeIndex === 0}
              className="hidden sm:flex absolute left-1 top-[7.5rem] -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow items-center justify-center text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={goNext}
              disabled={activeIndex === queue.length - 1}
              className="hidden sm:flex absolute right-1 top-[7.5rem] -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow items-center justify-center text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {queue.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {queue.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to photo ${i + 1}`}
              onClick={() => onActiveIndexChange(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === activeIndex ? "gradient-bg w-3" : "bg-stone-300 w-1.5"
              }`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail strip + Add more */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {queue.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onActiveIndexChange(idx)}
            aria-label={`Edit photo ${idx + 1}`}
            className={cn(
              "relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100 transition-all",
              idx === activeIndex
                ? "ring-2 ring-offset-2 ring-rose-300"
                : "opacity-70 hover:opacity-100"
            )}
          >
            {item.status === "done" ? (
              item.mediaType === "video" ? (
                <video
                  src={item.preview}
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <Image src={item.preview} alt="" fill sizes="56px" className="object-cover" />
              )
            ) : item.status === "error" ? (
              <div className="w-full h-full flex items-center justify-center bg-rose-50">
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />
              </div>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={onAddMore}
          aria-label="Add more photos"
          className="w-14 h-14 rounded-xl flex-shrink-0 border-2 border-dashed border-stone-200 hover:border-rose-300 hover:bg-rose-50/30 flex items-center justify-center text-rose-300 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

interface PhotoEditorPageProps {
  item: UploadQueueItem;
  babyBirthdate: string;
  onUpdate: (patch: Partial<UploadQueueItem>) => void;
  onRemove: () => void;
  onOpenLocationPicker: () => void;
}

function PhotoEditorPage({
  item,
  babyBirthdate,
  onUpdate,
  onRemove,
  onOpenLocationPicker,
}: PhotoEditorPageProps) {
  const caption = item.caption ?? "";
  const remaining = MAX_CAPTION_LENGTH - caption.length;
  const dateId = `photo-date-${item.id}`;
  const captionId = `photo-caption-${item.id}`;

  return (
    <div className="snap-center flex-shrink-0 w-full pr-3 last:pr-0 first:pl-0 space-y-3">
      {/* Preview */}
      <div className="aspect-video rounded-[2rem] overflow-hidden relative bg-stone-100">
        {item.status === "done" ? (
          item.mediaType === "video" ? (
            <video
              src={item.preview}
              muted
              autoPlay
              playsInline
              loop
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Image src={item.preview} alt="Preview" fill sizes="100vw" className="object-cover" />
          )
        ) : item.status === "error" ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-rose-500 gap-1">
            <AlertCircle className="w-6 h-6" />
            <span className="text-xs font-medium">Upload failed</span>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
          </div>
        )}

        {/* Remove */}
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove photo"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 flex items-center justify-center text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Date + Location */}
      <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
        <div className="min-w-0">
          <label htmlFor={dateId} className="text-xs text-stone-500 font-medium block mb-1">
            Date
          </label>
          <input
            id={dateId}
            type="date"
            value={item.date}
            min={babyBirthdate}
            max={todayString()}
            onChange={(e) => onUpdate({ date: e.target.value })}
            className="w-full px-3 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 appearance-none"
          />
        </div>
        <div className="min-w-0">
          <label className="text-xs text-stone-500 font-medium block mb-1">Location</label>
          <button
            type="button"
            onClick={onOpenLocationPicker}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-500 text-sm hover:border-rose-300 transition-colors truncate"
          >
            <MapPin className="w-4 h-4 shrink-0 text-stone-400" />
            <span className="truncate">{item.locationNickname ?? "Add location"}</span>
          </button>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor={captionId} className="text-xs text-stone-500 font-medium block mb-1">
          Description
        </label>
        <textarea
          id={captionId}
          value={caption}
          onChange={(e) => onUpdate({ caption: e.target.value })}
          maxLength={MAX_CAPTION_LENGTH}
          rows={3}
          placeholder="Write a memory…"
          className="w-full px-3 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
        />
        {caption.length > CAPTION_COUNTER_THRESHOLD && (
          <p
            className={cn(
              "mt-1 text-xs text-right",
              remaining < 50 ? "text-rose-500" : "text-stone-400"
            )}
          >
            {remaining} characters left
          </p>
        )}
      </div>

      {/* Milestone toggle */}
      <button
        type="button"
        onClick={() => onUpdate({ isMajor: !item.isMajor })}
        className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-colors ${
          item.isMajor ? "bg-rose-50/50 border-[#F8BBD0]" : "bg-stone-50 border-stone-200"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.isMajor ? "gradient-bg" : "bg-stone-200"}`}
        >
          <Award className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-bold text-stone-800 text-sm">Major Milestone</div>
          <div className="text-xs text-stone-400">Mark as a key moment</div>
        </div>
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            item.isMajor ? "gradient-bg border-transparent" : "border-stone-300"
          }`}
        >
          {item.isMajor && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
              <polyline
                points="2,6 5,9 10,3"
                strokeWidth="2"
                stroke="white"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
      </button>
    </div>
  );
}
