"use client";

import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import type { NotificationItem } from "@/actions/notifications";
import { cn } from "@/lib/utils";

interface NotificationListProps {
  items: NotificationItem[];
  loading: boolean;
  onItemClick: () => void;
}

export function NotificationList({ items, loading, onItemClick }: NotificationListProps) {
  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Bell className="w-8 h-8 mb-2 opacity-40" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="rounded-full bg-stone-100 p-3 mb-3">
          <Bell className="w-6 h-6 text-stone-400" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">No new memories yet</p>
        <p className="text-xs text-muted-foreground max-w-[16rem]">
          When people you follow add photos, you&apos;ll see them here.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col">
      {items.map((n) => {
        const initials = n.actor.name
          .split(/\s+/)
          .map((w) => w[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase();

        const params = new URLSearchParams({ babyId: n.babyId });
        if (n.stepId) params.set("stepId", n.stepId);
        const href = `/following/${n.actor.id}?${params.toString()}`;

        return (
          <li key={n.id}>
            <Link
              href={href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 hover:bg-muted/40 active:bg-muted/60 transition-colors border-b border-stone-100/70 last:border-b-0",
                !n.read && "bg-rose-50/40"
              )}
            >
              {/* Actor avatar */}
              <div className="relative shrink-0">
                {n.actor.image ? (
                  <Image
                    src={n.actor.image}
                    alt=""
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-semibold">
                    {initials || "·"}
                  </div>
                )}
                {!n.read && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-background" />
                )}
              </div>

              {/* Body */}
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">
                  <span className="font-medium text-foreground">{n.actor.name}</span>{" "}
                  <span className="text-muted-foreground">
                    added {n.photoCount} {n.photoCount === 1 ? "photo" : "photos"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                </p>
              </div>

              {/* Preview thumbnail */}
              {n.previewPhotoUrl && (
                <Image
                  src={n.previewPhotoUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
