"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  href?: string;
  className?: string;
}

export function BackButton({ href, className }: BackButtonProps) {
  const { push, back } = useRouter();

  const handleClick = () => {
    if (href) {
      push(href);
    } else {
      back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "size-10 rounded-full bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-700 transition-colors",
        className
      )}
    >
      <ArrowLeft className="size-5" />
    </button>
  );
}
