import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center text-center py-16 px-6", className)}
    >
      <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-stone-400" />
      </div>
      <h3 className="font-bold text-stone-700 text-lg mb-1">{title}</h3>
      <p className="text-stone-400 text-sm leading-relaxed max-w-xs">{description}</p>
    </div>
  );
}
