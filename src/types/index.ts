// Re-export Drizzle inferred types
export type { Baby, Step, SavedLocation } from "@/db/schema";

// ── Step types ────────────────────────────────────────────────────────────────

export type StepType = "photo" | "video" | "first_word" | "milestone";

// ── Upload queue (client-side) ────────────────────────────────────────────────

export interface UploadQueueItem {
  id: string;
  file: File;
  preview: string; // local blob URL while uploading; remote URL after upload
  objectUrl?: string; // original blob URL (kept so we can revoke once it's no longer in use)
  controller?: AbortController; // present while upload is in flight; cleared on settle
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
  followStatus: FollowStatus;
  babies: { id: string; name: string; photoUrl: string | null; birthdate: string }[];
}

// ── Invite types ────────────────────────────────────────────────────────────

export type InviteKind = "email" | "link";

export interface PendingInviteItem {
  id: string;
  kind: InviteKind;
  email: string | null;
  expiresAt: Date;
  url: string;
  isExpired: boolean;
  createdAt: Date;
}

export type InvitePreviewStatus = "valid" | "expired" | "revoked" | "accepted" | "not_found";

export interface ValidInvitePreview {
  status: "valid";
  kind: InviteKind;
  inviter: {
    id: string;
    name: string;
    image: string | null;
  };
  babies: { id: string; name: string; photoUrl: string | null; birthdate: string }[];
}

export type InvitePreview = ValidInvitePreview | { status: Exclude<InvitePreviewStatus, "valid"> };
