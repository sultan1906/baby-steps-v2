"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  href?: string;
  className?: string;
}

export function BackButton({ href, className }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-10 h-10 rounded-full bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-700 transition-colors",
        className
      )}
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );
}
