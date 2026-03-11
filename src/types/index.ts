// Re-export Drizzle inferred types
export type { Baby, Step, SavedLocation, DailyDescription } from "@/db/schema";

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
  mediaType: "photo" | "video";
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

// ── Social / Follow types ───────────────────────────────────────────────────

export type FollowStatus = "none" | "pending" | "accepted";

export interface UserSearchResult {
  id: string;
  name: string;
  image: string | null;
  isPublic: boolean;
  bio: string | null;
  location: string | null;
  followStatus: FollowStatus;
}

export interface FollowRequestItem {
  id: string;
  follower: {
    id: string;
    name: string;
    image: string | null;
  };
  createdAt: Date;
}

export interface FollowedUser {
  id: string;
  name: string;
  image: string | null;
  location: string | null;
  babies: { id: string; name: string; photoUrl: string | null; birthdate: string }[];
}

export interface UserProfile {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  location: string | null;
  isPublic: boolean;
  followStatus: FollowStatus;
  babies: { id: string; name: string; photoUrl: string | null; birthdate: string }[];
  followerCount: number;
  followingCount: number;
}
