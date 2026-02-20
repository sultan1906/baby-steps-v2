"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Award, Loader2, MapPin } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useBaby } from "@/components/baby/baby-provider";
import { createStep, createBulkSteps } from "@/actions/steps";
import { BulkUploadQueue } from "./bulk-upload-queue";
import { MapPickerDialog } from "./map-picker-dialog";
import { todayString } from "@/lib/date-utils";
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
  const [date, setDate] = useState(() => todayString());
  const [isMajor, setIsMajor] = useState(false);
  const [, setLocationId] = useState<string | undefined>();
  const [locationNickname, setLocationNickname] = useState<string | undefined>();
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setOpen(false);
    setQueue([]);
    setDate(todayString());
    setIsMajor(false);
    setLocationId(undefined);
    setLocationNickname(undefined);
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
        type: "photo" as const,
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

  const content = (
    <div className="flex flex-col h-full">
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
        {/* Bulk upload queue */}
        <BulkUploadQueue babyBirthdate={baby.birthdate} queue={queue} onQueueChange={setQueue} />

        {/* Single-mode fields (only shown when ≤ 1 file) */}
        {queue.length <= 1 && (
          <>
            {/* Date + Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="memory-date"
                  className="text-xs text-stone-500 font-medium block mb-1"
                >
                  Date
                </label>
                <input
                  id="memory-date"
                  type="date"
                  value={date}
                  min={baby.birthdate}
                  max={todayString()}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
              <div>
                <label
                  htmlFor="location-btn"
                  className="text-xs text-stone-500 font-medium block mb-1"
                >
                  Location
                </label>
                <button
                  id="location-btn"
                  onClick={() => setShowMapPicker(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-500 text-sm hover:border-rose-300 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-stone-400" />
                  {locationNickname ?? "Add location"}
                </button>
              </div>
            </div>

            {/* Milestone toggle */}
            <button
              onClick={() => setIsMajor(!isMajor)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-colors ${
                isMajor ? "bg-rose-50/50 border-[#F8BBD0]" : "bg-stone-50 border-stone-200"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${isMajor ? "gradient-bg" : "bg-stone-200"}`}
              >
                <Award className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-stone-800 text-sm">Major Milestone</div>
                <div className="text-xs text-stone-400">Mark as a key moment</div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isMajor ? "gradient-bg border-transparent" : "border-stone-300"
                }`}
              >
                {isMajor && (
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
          </>
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

      {/* Map picker */}
      <MapPickerDialog
        open={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onSelect={(id, nickname) => {
          setLocationId(id);
          setLocationNickname(nickname);
          setShowMapPicker(false);
        }}
      />

      {/* Mobile: Drawer / Desktop: Dialog */}
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[90vh] rounded-t-[3rem]">{content}</DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-xl rounded-[3rem] p-0 overflow-hidden max-h-[85vh] flex flex-col">
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
