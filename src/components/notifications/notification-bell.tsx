"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  type NotificationItem,
} from "@/actions/notifications";
import { NotificationList } from "./notification-list";
import { cn } from "@/lib/utils";

const POLL_MS = 60_000;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const [count, list] = await Promise.all([getUnreadCount(), getNotifications(30)]);
      setUnread(count);
      setItems(list);
    } catch {
      // Silently ignore — bell is non-critical UI.
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, POLL_MS);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next && unread > 0) {
        // Optimistically clear badge; persist on server.
        setUnread(0);
        setItems((prev) => prev.map((i) => ({ ...i, read: true })));
        void markAllRead();
      }
    },
    [unread]
  );

  const badge = unread > 9 ? "9+" : String(unread);

  return (
    <>
      <button
        type="button"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        onClick={() => handleOpenChange(true)}
        className={cn(
          "fixed top-3 right-3 z-50",
          "w-10 h-10 rounded-full bg-white/85 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.06)]",
          "border border-stone-200/70",
          "flex items-center justify-center",
          "hover:bg-white active:scale-95 transition",
          "[padding-top:env(safe-area-inset-top)]"
        )}
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        <Bell className="w-5 h-5 text-stone-700" />
        {unread > 0 && (
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5",
              "min-w-[18px] h-[18px] px-1 rounded-full",
              "bg-rose-500 text-white text-[10px] font-semibold",
              "flex items-center justify-center",
              "ring-2 ring-background"
            )}
          >
            {badge}
          </span>
        )}
      </button>

      <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
        <DrawerContent className="sm:max-w-md flex flex-col">
          <div className="px-4 py-3 border-b border-stone-100">
            <DrawerTitle className="text-base font-semibold">Notifications</DrawerTitle>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NotificationList items={items} loading={loading} onItemClick={() => setOpen(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
