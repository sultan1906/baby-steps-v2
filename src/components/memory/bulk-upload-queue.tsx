"use client";

import { useRef, useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import { Camera } from "lucide-react";
import exifr from "exifr";
import { format, parseISO, isBefore } from "date-fns";
import type { UploadQueueItem } from "@/types";
import { toast } from "sonner";

interface BulkUploadQueueProps {
  babyBirthdate: string;
  queue: UploadQueueItem[];
  onQueueChange: Dispatch<SetStateAction<UploadQueueItem[]>>;
  /** Called once on mount with a function that opens the file picker. */
  onTriggerReady?: (trigger: () => void) => void;
}

export function BulkUploadQueue({
  babyBirthdate,
  queue,
  onQueueChange,
  onTriggerReady,
}: BulkUploadQueueProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const triggerPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  useEffect(() => {
    onTriggerReady?.(triggerPicker);
  }, [onTriggerReady, triggerPicker]);

  const processFiles = useCallback(
    async (files: FileList) => {
      const newItems: UploadQueueItem[] = [];

      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/");

        // Extract EXIF date (images only — exifr doesn't handle video)
        let date = format(new Date(file.lastModified), "yyyy-MM-dd");
        if (!isVideo) {
          try {
            const exif = await exifr.parse(file, { pick: ["DateTimeOriginal"] });
            if (exif?.DateTimeOriginal) {
              date = format(new Date(exif.DateTimeOriginal), "yyyy-MM-dd");
            }
          } catch {
            // Ignore EXIF errors, use fallback
          }
        }

        // Validate date is after baby's birthdate
        if (isBefore(parseISO(date), parseISO(babyBirthdate))) {
          toast.error(`"${file.name}" date is before baby's birthdate — using today`);
          date = format(new Date(), "yyyy-MM-dd");
        }

        const id = crypto.randomUUID();
        const preview = URL.createObjectURL(file);

        newItems.push({
          id,
          file,
          preview,
          status: "uploading",
          progress: 0,
          date,
          isMajor: false,
          mediaType: isVideo ? "video" : "photo",
        });
      }

      // Insert immediately so the user can edit metadata while uploads run.
      onQueueChange((prev) => [...prev, ...newItems]);

      // Kick off each upload independently; patch by id with functional state
      // so concurrent edits / item removals / drawer close are race-safe.
      for (const item of newItems) {
        void uploadOne(item, onQueueChange);
      }
    },
    [babyBirthdate, onQueueChange]
  );

  return (
    <>
      {/* Empty-state drop zone */}
      {queue.length === 0 && (
        <div
          role="button"
          tabIndex={0}
          onClick={triggerPicker}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && (e.preventDefault(), triggerPicker())
          }
          className="flex flex-col items-center justify-center aspect-video rounded-[2rem] border-2 border-dashed border-stone-200 hover:border-rose-300 hover:bg-rose-50/30 cursor-pointer transition-colors"
        >
          <Camera className="w-8 h-8 text-rose-300 mb-2" />
          <span className="text-stone-400 font-medium">Add Photos or Videos</span>
          <span className="text-stone-300 text-sm mt-1">+ Tap to upload</span>
        </div>
      )}

      <input
        ref={inputRef}
        id="media-upload"
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) processFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}

async function uploadOne(
  item: UploadQueueItem,
  onQueueChange: Dispatch<SetStateAction<UploadQueueItem[]>>
) {
  try {
    const fd = new FormData();
    fd.append("file", item.file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    const { url } = await res.json();
    onQueueChange((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, status: "done", preview: url, progress: 100 } : i
      )
    );
  } catch {
    onQueueChange((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: "error", progress: 0 } : i))
    );
  }
}
