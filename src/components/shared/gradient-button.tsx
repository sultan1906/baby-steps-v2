import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "vibrant" | "soft";
}

export function GradientButton({
  children,
  loading,
  variant = "vibrant",
  className,
  disabled,
  ...props
}: GradientButtonProps) {
  return (
    <button
      disabled={loading || disabled}
      className={cn(
        "flex items-center justify-center gap-2 font-bold text-white py-4 px-6 rounded-[1.75rem] transition-all",
        "hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:scale-100",
        variant === "vibrant" ? "gradient-bg-vibrant" : "gradient-bg",
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </button>
  );
}
