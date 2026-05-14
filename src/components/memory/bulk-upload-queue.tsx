"use client";

import { useRef, useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import { Camera } from "lucide-react";
import exifr from "exifr";
import { format, parseISO, isBefore } from "date-fns";
import type { UploadQueueItem } from "@/types";
import { toast } from "sonner";
import { generateVideoPoster } from "@/lib/video-poster";

const EXIF_CONCURRENCY = 6;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const idx = next++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}

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
      const fileArr = Array.from(files);

      // Extract EXIF dates with bounded concurrency so a 50-photo bulk upload
      // doesn't open 50 parallel reads.
      const dates = await mapWithConcurrency(fileArr, EXIF_CONCURRENCY, async (file) => {
        const fallback = format(new Date(file.lastModified), "yyyy-MM-dd");
        if (file.type.startsWith("video/")) return fallback;
        try {
          const exif = await exifr.parse(file, { pick: ["DateTimeOriginal"] });
          if (exif?.DateTimeOriginal) {
            return format(new Date(exif.DateTimeOriginal), "yyyy-MM-dd");
          }
        } catch {
          // Ignore EXIF errors, use fallback
        }
        return fallback;
      });

      const newItems: UploadQueueItem[] = fileArr.map((file, i) => {
        const isVideo = file.type.startsWith("video/");
        let date = dates[i];

        if (isBefore(parseISO(date), parseISO(babyBirthdate))) {
          toast.error(`"${file.name}" date is before baby's birthdate — using today`);
          date = format(new Date(), "yyyy-MM-dd");
        }

        const objectUrl = URL.createObjectURL(file);
        return {
          id: crypto.randomUUID(),
          file,
          preview: objectUrl,
          objectUrl,
          controller: new AbortController(),
          status: "uploading",
          progress: 0,
          date,
          isMajor: false,
          mediaType: isVideo ? "video" : "photo",
        };
      });

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
          <Camera className="size-8 text-rose-300 mb-2" />
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
    // For videos, generate a poster thumbnail in parallel with the video upload
    // so the timeline shows a real frame instead of a white box on iOS Safari.
    // Poster gen is best-effort — never let it block or fail the video upload.
    const posterPromise =
      item.mediaType === "video"
        ? generateVideoPoster(item.file).catch(() => null)
        : Promise.resolve(null);

    const fd = new FormData();
    fd.append("file", item.file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: fd,
      signal: item.controller?.signal,
    });
    if (!res.ok) throw new Error("Upload failed");
    const { url } = await res.json();

    // Give the poster a brief grace period to finish, but don't stall the
    // queue if a slow device hasn't decoded yet.
    const posterBlob = await Promise.race<Blob | null>([
      posterPromise,
      new Promise((resolve) => setTimeout(() => resolve(null), 1500)),
    ]);

    let posterUrl: string | undefined;
    if (posterBlob) {
      try {
        const posterFd = new FormData();
        posterFd.append("file", new File([posterBlob], "poster.jpg", { type: "image/jpeg" }));
        const posterRes = await fetch("/api/upload?kind=poster", {
          method: "POST",
          body: posterFd,
          signal: item.controller?.signal,
        });
        if (posterRes.ok) {
          const data = await posterRes.json();
          posterUrl = data.url as string;
        }
      } catch {
        // Poster upload failure is non-fatal; the video still saves without one.
      }
    }

    onQueueChange((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: "done",
              preview: url,
              posterUrl,
              progress: 100,
              objectUrl: undefined,
              controller: undefined,
            }
          : i
      )
    );
  } catch {
    // AbortError or network/server failure. The item may already be removed —
    // the functional update will simply no-op in that case.
    onQueueChange((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, status: "error", progress: 0, objectUrl: undefined, controller: undefined }
          : i
      )
    );
  } finally {
    if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
  }
}
