"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/utils";

interface SelectModeActionBarProps {
  message: string;
  primaryLabel: string;
  primaryDisabled?: boolean;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
}

export function SelectModeActionBar({
  message,
  primaryLabel,
  primaryDisabled,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: SelectModeActionBarProps) {
  return (
    <m.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+64px)] z-50 px-4 pb-3 pt-3 bg-white/90 backdrop-blur-xl border-t border-stone-100 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <button
          type="button"
          onClick={onSecondary}
          className="px-4 h-10 rounded-full text-sm font-medium text-stone-600 bg-white border border-stone-200 hover:bg-stone-50 transition"
        >
          {secondaryLabel}
        </button>
        <span className="text-sm text-stone-600 font-medium truncate">{message}</span>
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled}
          className={cn(
            "px-5 h-10 rounded-full text-sm font-semibold text-white shadow transition",
            primaryDisabled
              ? "bg-stone-300 cursor-not-allowed"
              : "gradient-bg-vibrant hover:opacity-90"
          )}
        >
          {primaryLabel}
        </button>
      </div>
    </m.div>
  );
}
