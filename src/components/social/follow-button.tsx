"use client";

import { useState } from "react";
import { Loader2, UserPlus, UserCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendFollowRequest, unfollowUser } from "@/actions/social";
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

  const handleClick = async () => {
    setLoading(true);
    try {
      if (status === "none") {
        const result = await sendFollowRequest(userId);
        const newStatus = result.status === "accepted" ? "accepted" : "pending";
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      } else if (status === "accepted") {
        await unfollowUser(userId);
        setStatus("none");
        onStatusChange?.("none");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

  if (status === "pending") {
    return (
      <button
        disabled
        className={cn(
          "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-stone-100 text-stone-500 border border-stone-200",
          className
        )}
      >
        <Clock className="w-3.5 h-3.5" />
        Requested
      </button>
    );
  }

  if (status === "accepted") {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
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

  // status === "none"
  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold gradient-bg-vibrant text-white transition-transform active:scale-95",
        className
      )}
    >
      <UserPlus className="w-3.5 h-3.5" />
      Follow
    </button>
  );
}
