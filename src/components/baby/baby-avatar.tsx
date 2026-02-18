import Image from "next/image";
import { cn } from "@/lib/utils";

interface BabyAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: number;
  className?: string;
}

export function BabyAvatar({ name, photoUrl, size = 48, className }: BabyAvatarProps) {
  const initial = name?.[0]?.toUpperCase() ?? "?";

  return (
    <div
      className={cn("relative flex-shrink-0 rounded-2xl overflow-hidden", className)}
      style={{ width: size, height: size }}
    >
      {photoUrl ? (
        <Image src={photoUrl} alt={name} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <div
          className="w-full h-full gradient-bg flex items-center justify-center text-white font-bold"
          style={{ fontSize: size * 0.4 }}
        >
          {initial}
        </div>
      )}
    </div>
  );
}
