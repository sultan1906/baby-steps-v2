"use client";

import { useState } from "react";
import { Loader2, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { unfollowUser } from "@/actions/social";
import { toast } from "sonner";
import type { FollowStatus } from "@/types";

interface FollowButtonProps {
  userId: string;
  initialStatus: FollowStatus;
  className?: string;
  onStatusChange?: (newStatus: FollowStatus) => void;
}

export function FollowButton({
  userId,
  initialStatus,
  className,
  onStatusChange,
}: FollowButtonProps) {
  const [status, setStatus] = useState<FollowStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [hovering, setHovering] = useState(false);

  const handleUnfollow = async () => {
    setLoading(true);
    try {
      await unfollowUser(userId);
      setStatus("none");
      onStatusChange?.("none");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status !== "accepted") return null;

  if (loading) {
    return (
      <button
        disabled
        className={cn(
          "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-stone-100 text-stone-400",
          className
        )}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      </button>
    );
  }

  return (
    <button
      aria-label="Unfollow"
      onClick={handleUnfollow}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
        hovering
          ? "bg-red-50 text-red-500 border-red-200"
          : "bg-stone-50 text-stone-700 border-stone-200",
        className
      )}
    >
      <UserCheck className="w-3.5 h-3.5" />
      {hovering ? "Unfollow" : "Following"}
    </button>
  );
}
