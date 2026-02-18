// Re-export Drizzle inferred types
export type {
  User,
  Baby,
  Step,
  DailyDescription,
  SavedLocation,
  NewStep,
  NewBaby,
} from "@/db/schema";

// ── Step types ────────────────────────────────────────────────────────────────

export type StepType = "photo" | "video" | "growth" | "first_word" | "milestone";

// ── Upload queue (client-side) ────────────────────────────────────────────────

export interface UploadQueueItem {
  id: string;
  file: File;
  preview: string; // URL.createObjectURL()
  status: "pending" | "uploading" | "done" | "error";
  progress: number; // 0-100
  date: string; // "YYYY-MM-DD" from EXIF or fallback
  isMajor: boolean;
  locationId?: string;
  locationNickname?: string;
  caption?: string;
}

// ── Step input for server actions ─────────────────────────────────────────────

export interface StepInput {
  babyId: string;
  photoUrl?: string;
  date: string; // "YYYY-MM-DD"
  locationId?: string;
  locationNickname?: string;
  isMajor?: boolean;
  type?: StepType;
  weight?: number;
  height?: number;
  firstWord?: string;
  title?: string;
  caption?: string;
}

// ── Location search ───────────────────────────────────────────────────────────

export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

// ── Timeline state ────────────────────────────────────────────────────────────

export interface DayGroup {
  date: string; // "YYYY-MM-DD"
  steps: import("@/db/schema").Step[];
  hasSteps: boolean;
  isMajor: boolean;
}

export interface MonthPill {
  monthIndex: number; // 0 = birth month
  label: string; // "Birth" | "Month 1" | ...
  dateRange: string; // "Jan 15 – Feb 14"
  hasSteps: boolean;
  isFuture: boolean;
}
