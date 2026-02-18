"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Images, BarChart2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddMemoryDrawer } from "@/components/memory/add-memory-drawer";

const navItems = [
  { href: "/timeline", icon: Home, label: "Timeline" },
  { href: "/gallery", icon: Images, label: "Gallery" },
  { href: "/dashboard", icon: BarChart2, label: "Stats" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-stone-100/50 safe-area-inset-bottom">
      <div className="flex items-center justify-around px-4 py-2 max-w-lg mx-auto">
        {navItems.slice(0, 2).map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-3 text-xs transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}

        {/* Center FAB */}
        <AddMemoryDrawer>
          <button className="gradient-bg-vibrant rounded-full p-4 shadow-[0_8px_30px_rgba(240,98,146,0.4)] hover:scale-105 active:scale-95 transition-transform -mt-5">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </AddMemoryDrawer>

        {navItems.slice(2).map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-3 text-xs transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
