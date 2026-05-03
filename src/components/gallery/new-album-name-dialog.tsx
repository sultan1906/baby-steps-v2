"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_NAME_LENGTH = 80;

interface NewAlbumNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void> | void;
  selectedCount: number;
}

export function NewAlbumNameDialog({
  open,
  onOpenChange,
  onSubmit,
  selectedCount,
}: NewAlbumNameDialogProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setSubmitting(false);
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const trimmed = name.trim();
  const valid = trimmed.length > 0 && trimmed.length <= MAX_NAME_LENGTH;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">Name your album</DialogTitle>
          <p className="text-sm text-stone-500">
            {selectedCount} {selectedCount === 1 ? "photo" : "photos"} will be added.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            placeholder="e.g. Summer in the park"
            className={cn(
              "w-full px-4 h-11 rounded-xl bg-stone-50 border border-stone-200",
              "text-sm placeholder:text-stone-400 outline-none transition",
              "focus:bg-white focus:border-rose-300"
            )}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={!valid || submitting}
              className={cn(
                "px-5 h-9 rounded-md text-sm font-semibold text-white shadow transition",
                !valid || submitting
                  ? "bg-stone-300 cursor-not-allowed"
                  : "gradient-bg-vibrant hover:opacity-90"
              )}
            >
              {submitting ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
