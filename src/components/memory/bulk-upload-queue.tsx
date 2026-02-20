"use client";

import { useRef, useCallback } from "react";
import { Camera, X, Check, Loader2, Award, AlertCircle } from "lucide-react";
import exifr from "exifr";
import { format, parseISO, isBefore } from "date-fns";
import { cn } from "@/lib/utils";
import type { UploadQueueItem } from "@/types";
import { toast } from "sonner";
import Image from "next/image";

interface BulkUploadQueueProps {
  babyBirthdate: string;
  queue: UploadQueueItem[];
  onQueueChange: (queue: UploadQueueItem[]) => void;
}

export function BulkUploadQueue({ babyBirthdate, queue, onQueueChange }: BulkUploadQueueProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: FileList) => {
      const newItems: UploadQueueItem[] = [];

      for (const file of Array.from(files)) {
        // Extract EXIF date
        let date = format(new Date(file.lastModified), "yyyy-MM-dd");
        try {
          const exif = await exifr.parse(file, { pick: ["DateTimeOriginal"] });
          if (exif?.DateTimeOriginal) {
            date = format(new Date(exif.DateTimeOriginal), "yyyy-MM-dd");
          }
        } catch {
          // Ignore EXIF errors, use fallback
        }

        // Validate date is after baby's birthdate
        if (isBefore(parseISO(date), parseISO(babyBirthdate))) {
          toast.error(`"${file.name}" date is before baby's birthdate — using today`);
          date = format(new Date(), "yyyy-MM-dd");
        }

        // Upload to Vercel Blob
        const id = crypto.randomUUID();
        const preview = URL.createObjectURL(file);

        newItems.push({
          id,
          file,
          preview,
          status: "pending",
          progress: 0,
          date,
          isMajor: false,
        });
      }

      // Trigger uploads
      const withUploads = await uploadItems(newItems);
      onQueueChange([...queue, ...withUploads]);
    },
    [babyBirthdate, queue, onQueueChange]
  );

  const uploadItems = async (items: UploadQueueItem[]): Promise<UploadQueueItem[]> => {
    return Promise.all(
      items.map(async (item) => {
        try {
          const updated: UploadQueueItem = { ...item, status: "uploading" };
          const fd = new FormData();
          fd.append("file", item.file);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          if (!res.ok) throw new Error("Upload failed");
          const { url } = await res.json();
          return { ...updated, status: "done", preview: url, progress: 100 };
        } catch {
          return { ...item, status: "error", progress: 0 };
        }
      })
    );
  };

  const removeItem = (id: string) => {
    onQueueChange(queue.filter((i) => i.id !== id));
  };

  const toggleMilestone = (id: string) => {
    onQueueChange(queue.map((i) => (i.id === id ? { ...i, isMajor: !i.isMajor } : i)));
  };

  const updateDate = (id: string, date: string) => {
    onQueueChange(queue.map((i) => (i.id === id ? { ...i, date } : i)));
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {queue.length === 0 ? (
        <label
          htmlFor="media-upload"
          className="flex flex-col items-center justify-center aspect-video rounded-[2rem] border-2 border-dashed border-stone-200 hover:border-rose-300 hover:bg-rose-50/30 cursor-pointer transition-colors"
        >
          <Camera className="w-8 h-8 text-rose-300 mb-2" />
          <span className="text-stone-400 font-medium">Add Photos or Videos</span>
          <span className="text-stone-300 text-sm mt-1">+ Tap to upload</span>
        </label>
      ) : (
        <div
          role="button"
          tabIndex={0}
          className="aspect-video rounded-[2rem] overflow-hidden relative cursor-pointer group"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          {queue[0].status === "done" ? (
            <Image src={queue[0].preview} alt="Preview" fill sizes="100vw" className="object-cover" />
          ) : (
            <div className="w-full h-full bg-stone-100 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 text-white font-medium text-sm bg-black/50 px-3 py-1.5 rounded-full">
              Add more
            </span>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        id="media-upload"
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && processFiles(e.target.files)}
      />

      {/* Queue list (multiple items) */}
      {queue.length > 1 && (
        <div className="bg-stone-50 rounded-[2rem] border border-stone-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-stone-700 text-sm">Queue ({queue.length})</span>
            <button
              onClick={() => onQueueChange([])}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2 max-h-[240px] overflow-y-auto scrollbar-hide">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-2 border-b border-stone-100 last:border-0"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden relative flex-shrink-0 bg-stone-100">
                  {item.status === "done" ? (
                    <Image src={item.preview} alt="" fill sizes="64px" className="object-cover" />
                  ) : item.status === "uploading" ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />
                    </div>
                  ) : item.status === "error" ? (
                    <div className="w-full h-full flex items-center justify-center bg-rose-50">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-stone-300 animate-spin" />
                    </div>
                  )}
                  {item.status === "done" && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full gradient-bg flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>

                {/* Date + controls */}
                <div className="flex-1 min-w-0">
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) => updateDate(item.id, e.target.value)}
                    className="text-xs text-stone-600 bg-white border border-stone-200 rounded-lg px-2 py-1 w-full"
                  />
                </div>

                {/* Milestone toggle */}
                <button
                  onClick={() => toggleMilestone(item.id)}
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0",
                    item.isMajor ? "gradient-bg" : "bg-stone-200"
                  )}
                >
                  <Award className="w-4 h-4 text-white" />
                </button>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="w-6 h-6 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center flex-shrink-0"
                >
                  <X className="w-3 h-3 text-stone-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
