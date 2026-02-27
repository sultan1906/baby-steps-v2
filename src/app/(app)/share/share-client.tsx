"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, Share2, Images } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { BackButton } from "@/components/shared/back-button";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { getDayNumber, formatMemoryDate } from "@/lib/date-utils";
import { parseISO, format } from "date-fns";
import type { Step, Baby } from "@/types";

type PostcardStyle = "modern" | "classic" | "soft";

interface ShareClientProps {
  steps: Step[];
  baby: Baby;
}

const STYLES: { id: PostcardStyle; label: string }[] = [
  { id: "modern", label: "Modern" },
  { id: "classic", label: "Classic" },
  { id: "soft", label: "Soft" },
];

const STYLE_CONFIG: Record<PostcardStyle, { bg: string; text: string; subtext: string }> = {
  modern: { bg: "gradient-bg-vibrant", text: "text-white", subtext: "text-white/70" },
  classic: { bg: "bg-stone-900", text: "text-white", subtext: "text-white/60" },
  soft: { bg: "bg-rose-50", text: "text-rose-700", subtext: "text-rose-400" },
};

export function ShareClient({ steps, baby }: ShareClientProps) {
  const [selectedStep, setSelectedStep] = useState<Step | null>(steps[0] ?? null);
  const [style, setStyle] = useState<PostcardStyle>("modern");
  const [dedication, setDedication] = useState("");

  if (steps.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-stone-100/50">
          <div className="flex items-center gap-3 px-4 py-3">
            <BackButton />
            <h1 className="font-bold text-stone-800 text-lg">Memory Postcards</h1>
          </div>
        </div>
        <EmptyState
          icon={Images}
          title="No memories yet"
          description="Add some memories first, then create beautiful postcards to share!"
        />
      </div>
    );
  }

  const handleShare = () => {
    if (!selectedStep) return;
    const dayNumber = getDayNumber(parseISO(baby.birthdate), parseISO(selectedStep.date));
    const dateLabel = formatMemoryDate(selectedStep.date);
    const text = [
      `${baby.name}'s Journey — Day ${dayNumber} (${dateLabel})`,
      dedication.trim(),
      "📸 Captured with Baby Steps",
    ]
      .filter(Boolean)
      .join("\n\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const styleConfig = STYLE_CONFIG[style];
  const selectedDayNumber = selectedStep
    ? getDayNumber(parseISO(baby.birthdate), parseISO(selectedStep.date))
    : null;
  const year = selectedStep ? format(parseISO(selectedStep.date), "yyyy") : "";

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-stone-100/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <BackButton />
          <h1 className="font-bold text-stone-800 text-lg">Memory Postcards</h1>
        </div>
      </div>

      <div className="px-4 pb-28 pt-4 space-y-6">
        {/* 1. Pick a Memory */}
        <div>
          <p className="text-xs text-stone-400 font-bold uppercase tracking-wide mb-3">
            1. Pick a Memory
          </p>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {steps.map((s) => (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedStep(s)}
                onKeyDown={(e) => e.key === "Enter" && setSelectedStep(s)}
                className={cn(
                  "relative w-24 h-24 rounded-2xl overflow-hidden cursor-pointer flex-shrink-0 transition-all",
                  selectedStep?.id === s.id
                    ? "ring-4 ring-[#F06292] scale-110 shadow-lg"
                    : "ring-4 ring-white opacity-70"
                )}
              >
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
                    <Image src={s.photoUrl} alt="" fill sizes="96px" className="object-cover" />
                  )
                ) : (
                  <div className="w-full h-full gradient-bg" />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {selectedStep && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* 2. Style Picker */}
              <div>
                <p className="text-xs text-stone-400 font-bold uppercase tracking-wide mb-3">
                  2. Design Style
                </p>
                <div className="flex gap-2">
                  {STYLES.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setStyle(id)}
                      className={cn(
                        "flex-1 py-2 rounded-2xl text-sm font-medium transition-all",
                        style === id
                          ? "gradient-bg-vibrant text-white shadow"
                          : "bg-stone-50 text-stone-600 border border-stone-200"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Dedication */}
              <div>
                <p className="text-xs text-stone-400 font-bold uppercase tracking-wide mb-3">
                  3. Add Dedication
                </p>
                <textarea
                  value={dedication}
                  onChange={(e) => setDedication(e.target.value)}
                  placeholder="Write something sweet..."
                  rows={3}
                  className="w-full rounded-3xl bg-stone-50 border border-stone-200 p-4 text-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                />
              </div>

              {/* 4. Postcard Preview */}
              <div>
                <p className="text-xs text-stone-400 font-bold uppercase tracking-wide mb-3">
                  Preview
                </p>
                <div
                  className={cn(
                    "aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl",
                    style !== "modern" && styleConfig.bg
                  )}
                >
                  {style === "modern" ? (
                    <div className="w-full h-full gradient-bg-vibrant" />
                  ) : null}
                  <div className="relative w-full h-full flex flex-col">
                    {/* Photo - top 65% */}
                    <div className="flex-[0_0_65%] p-4 relative">
                      {selectedStep.photoUrl ? (
                        <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-inner">
                          {selectedStep.type === "video" ? (
                            <video
                              src={selectedStep.photoUrl}
                              muted
                              autoPlay
                              playsInline
                              loop
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <Image
                              src={selectedStep.photoUrl}
                              alt=""
                              fill
                              sizes="(max-width: 640px) 85vw, 360px"
                              className="object-cover"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-[2rem] bg-white/20" />
                      )}
                    </div>
                    {/* Text - bottom 35% */}
                    <div
                      className={cn("flex-1 px-6 pb-6 flex flex-col justify-end", styleConfig.text)}
                    >
                      {dedication && (
                        <p className={cn("italic font-serif text-base mb-2", styleConfig.text)}>
                          {dedication}
                        </p>
                      )}
                      <p className={cn("text-xs uppercase tracking-widest", styleConfig.subtext)}>
                        {baby.name} · Day {selectedDayNumber} · {year}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-stone-700 font-medium text-sm">
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 gradient-bg-vibrant text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
