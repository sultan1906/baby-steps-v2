"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useBaby } from "@/components/baby/baby-provider";
import { createStep, createBulkSteps } from "@/actions/steps";
import { BulkUploadQueue } from "./bulk-upload-queue";
import { PhotoEditorPager } from "./photo-editor-pager";
import { MapPickerDialog, MapPickerInline } from "./map-picker-dialog";
import type { UploadQueueItem } from "@/types";
import confetti from "canvas-confetti";

interface AddMemoryDrawerProps {
  children: React.ReactNode;
}

export function AddMemoryDrawer({ children }: AddMemoryDrawerProps) {
  const router = useRouter();
  const { baby } = useBaby();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [open, setOpen] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [locationEditingItemId, setLocationEditingItemId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [triggerAddMore, setTriggerAddMore] = useState<(() => void) | null>(null);

  const handleClose = () => {
    setOpen(false);
    setQueue([]);
    setLocationEditingItemId(null);
  };

  const handleSave = async () => {
    if (queue.length === 0) return;
    setSaving(true);

    try {
      const steps = queue.map((item) => ({
        babyId: baby.id,
        photoUrl: item.status === "done" ? item.preview : undefined,
        date: item.date,
        isMajor: item.isMajor,
        locationId: item.locationId,
        locationNickname: item.locationNickname,
        caption: item.caption?.trim() || undefined,
        type: item.mediaType ?? "photo",
      }));

      if (steps.length === 1) {
        await createStep(steps[0]);
      } else {
        await createBulkSteps(steps);
      }

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.7 },
        colors: ["#F06292", "#FFB74D", "#F8BBD0"],
      });

      handleClose();
      router.refresh();
    } catch {
      // Error handled by upload queue
    } finally {
      setSaving(false);
    }
  };

  const handleLocationSelect = useCallback(
    (id: string, nickname: string) => {
      if (!locationEditingItemId) return;
      setQueue((prev) =>
        prev.map((i) =>
          i.id === locationEditingItemId ? { ...i, locationId: id, locationNickname: nickname } : i
        )
      );
      setLocationEditingItemId(null);
    },
    [locationEditingItemId]
  );

  const handleTriggerReady = useCallback((trigger: () => void) => {
    setTriggerAddMore(() => trigger);
  }, []);

  const showMapPicker = locationEditingItemId !== null;

  const content = (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-stone-100/50">
        <div>
          <h2 className="text-xl font-bold text-stone-800">Capture Memory</h2>
          <p className="text-sm text-stone-400">{baby.name}</p>
        </div>
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-[1.25rem] bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <BulkUploadQueue
          babyBirthdate={baby.birthdate}
          queue={queue}
          onQueueChange={setQueue}
          onTriggerReady={handleTriggerReady}
        />

        {queue.length >= 1 && (
          <PhotoEditorPager
            queue={queue}
            onQueueChange={setQueue}
            onAddMore={() => triggerAddMore?.()}
            onOpenLocationPicker={(itemId) => setLocationEditingItemId(itemId)}
            babyBirthdate={baby.birthdate}
          />
        )}
      </div>

      {/* Submit button */}
      <div className="p-6 border-t border-stone-100/50">
        <button
          onClick={handleSave}
          disabled={saving || queue.filter((i) => i.status === "done").length === 0}
          className="gradient-bg-vibrant w-full py-4 rounded-[1.75rem] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : queue.length > 1 ? (
            `Save ${queue.filter((i) => i.status === "done").length} Memories`
          ) : (
            "Save Memory"
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Trigger */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
      >
        {children}
      </div>

      {/* Desktop: map picker Dialog portal */}
      {!isMobile && showMapPicker && (
        <MapPickerDialog
          open={showMapPicker}
          onClose={() => setLocationEditingItemId(null)}
          onSelect={handleLocationSelect}
        />
      )}

      {/* Mobile: Drawer / Desktop: Dialog */}
      {isMobile ? (
        <Drawer
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setLocationEditingItemId(null);
          }}
        >
          <DrawerContent className="max-h-[90dvh] rounded-t-[3rem]">
            <DrawerTitle className="sr-only">Capture Memory</DrawerTitle>
            {showMapPicker ? (
              <MapPickerInline
                open={showMapPicker}
                onClose={() => setLocationEditingItemId(null)}
                onSelect={handleLocationSelect}
              />
            ) : (
              content
            )}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setLocationEditingItemId(null);
          }}
        >
          <DialogContent
            className="max-w-xl rounded-[3rem] p-0 overflow-hidden max-h-[85vh] flex flex-col"
            showCloseButton={false}
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Capture Memory</DialogTitle>
            </DialogHeader>
            {content}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
