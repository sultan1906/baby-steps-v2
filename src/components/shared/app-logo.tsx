import { Footprints } from "lucide-react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-10 h-10",
} as const;

export function AppLogo({
  size = "md",
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  return <Footprints className={cn(sizes[size], "text-rose-400", className)} />;
}
