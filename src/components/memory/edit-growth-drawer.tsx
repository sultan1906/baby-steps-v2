"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Award, Loader2, MapPin, Ruler } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MapPickerDialog } from "./map-picker-dialog";
import { updateStep } from "@/actions/steps";
import { todayString } from "@/lib/date-utils";
import { toast } from "sonner";
import type { Step, Baby } from "@/types";

interface EditGrowthDrawerProps {
  step: Step;
  baby: Baby;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: Step) => void;
  /** Raise z-index above z-[100] overlays (e.g. StoryViewModal) */
  elevated?: boolean;
}

export function EditGrowthDrawer({
  step,
  baby,
  open,
  onClose,
  onSaved,
  elevated,
}: EditGrowthDrawerProps) {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [weight, setWeight] = useState(String(step.weight ?? ""));
  const [height, setHeight] = useState(step.height ? String(step.height) : "");
  const [caption, setCaption] = useState(step.caption ?? "");
  const [date, setDate] = useState(step.date);
  const [isMajor, setIsMajor] = useState(step.isMajor);
  const [locationId, setLocationId] = useState<string | undefined>(step.locationId ?? undefined);
  const [locationNickname, setLocationNickname] = useState<string | undefined>(
    step.locationNickname ?? undefined
  );
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const w = parseFloat(weight);
    if (!Number.isFinite(w) || w <= 0) return;
    const h = height ? parseFloat(height) : undefined;
    const validHeight = h !== undefined && Number.isFinite(h) && h > 0 ? h : null;

    setSaving(true);
    try {
      const updated = await updateStep(step.id, {
        weight: w,
        height: validHeight,
        caption: caption.trim() || null,
        date,
        isMajor,
        locationId: locationId ?? null,
        locationNickname: locationNickname ?? null,
      });
      toast.success("Growth entry updated!");
      onSaved(updated);
      onClose();
      router.refresh();
    } catch (err) {
      console.error("Failed to update growth entry:", err);
      toast.error("Failed to update growth entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-stone-100/50">
        <div>
          <h2 className="text-xl font-bold text-stone-800">Edit Growth Check-in</h2>
          <p className="text-sm text-stone-400">{baby.name}</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-[1.25rem] bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Growth form */}
        <div className="bg-stone-50 rounded-[2rem] border border-stone-100 p-5 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Ruler className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-stone-800 text-sm">Growth Check-in</div>
              <div className="text-xs text-stone-400">Track weight & height</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="edit-growth-weight"
                className="text-xs text-stone-500 font-medium block mb-1"
              >
                Weight (kg) *
              </label>
              <input
                id="edit-growth-weight"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="e.g. 4.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl bg-white border border-stone-200 text-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div>
              <label
                htmlFor="edit-growth-height"
                className="text-xs text-stone-500 font-medium block mb-1"
              >
                Height (cm)
              </label>
              <input
                id="edit-growth-height"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="e.g. 52"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl bg-white border border-stone-200 text-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-growth-caption"
              className="text-xs text-stone-500 font-medium block mb-1"
            >
              Note (optional)
            </label>
            <textarea
              id="edit-growth-caption"
              rows={2}
              placeholder="Doctor visit, monthly check-in..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-white border border-stone-200 text-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
            />
          </div>
        </div>

        {/* Date + Location */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="edit-memory-date"
              className="text-xs text-stone-500 font-medium block mb-1"
            >
              Date
            </label>
            <input
              id="edit-memory-date"
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
              htmlFor="edit-location-btn"
              className="text-xs text-stone-500 font-medium block mb-1"
            >
              Location
            </label>
            <button
              id="edit-location-btn"
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
      </div>

      {/* Submit button */}
      <div className="p-6 border-t border-stone-100/50">
        <button
          onClick={handleSave}
          disabled={saving || !Number.isFinite(parseFloat(weight)) || parseFloat(weight) <= 0}
          className="gradient-bg-vibrant w-full py-4 rounded-[1.75rem] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {showMapPicker && (
        <MapPickerDialog
          open={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onSelect={(id, nickname) => {
            setLocationId(id);
            setLocationNickname(nickname);
            setShowMapPicker(false);
          }}
        />
      )}

      {isMobile ? (
        <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
          <DrawerContent
            className={`max-h-[90vh] rounded-t-[3rem] ${elevated ? "z-[110]" : ""}`}
            overlayClassName={elevated ? "z-[110]" : undefined}
          >
            {content}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
          <DialogContent
            className={`max-w-xl rounded-[3rem] p-0 overflow-hidden max-h-[85vh] flex flex-col ${elevated ? "z-[110]" : ""}`}
            overlayClassName={elevated ? "z-[110]" : undefined}
            showCloseButton={false}
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Edit Growth Check-in</DialogTitle>
            </DialogHeader>
            {content}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
