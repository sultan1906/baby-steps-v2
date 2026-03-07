"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { UserAvatar } from "./user-avatar";
import { acceptFollowRequest, rejectFollowRequest } from "@/actions/social";
import type { FollowRequestItem } from "@/types";

interface FollowRequestCardProps {
  request: FollowRequestItem;
  onHandled?: () => void;
}

export function FollowRequestCard({ request, onHandled }: FollowRequestCardProps) {
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);
  const [handled, setHandled] = useState(false);

  if (handled) return null;

  const handleAccept = async () => {
    setLoading("accept");
    try {
      await acceptFollowRequest(request.id);
      setHandled(true);
      onHandled?.();
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    setLoading("reject");
    try {
      await rejectFollowRequest(request.id);
      setHandled(true);
      onHandled?.();
    } finally {
      setLoading(null);
    }
  };

  const timeAgo = getTimeAgo(request.createdAt);

  return (
    <div className="flex items-center gap-3 py-3">
      <UserAvatar name={request.follower.name} image={request.follower.image} size={44} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-stone-800 truncate">{request.follower.name}</p>
        <p className="text-xs text-stone-400">{timeAgo}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleAccept}
          disabled={!!loading}
          className="w-9 h-9 rounded-xl gradient-bg-vibrant flex items-center justify-center text-white transition-transform active:scale-95 disabled:opacity-50"
        >
          {loading === "accept" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={handleReject}
          disabled={!!loading}
          className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          {loading === "reject" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}
