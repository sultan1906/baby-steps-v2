import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  image?: string | null;
  size?: number;
  className?: string;
}

export function UserAvatar({ name, image, size = 40, className }: UserAvatarProps) {
  const initial = name?.[0]?.toUpperCase() ?? "?";

  return (
    <div
      className={cn("relative flex-shrink-0 rounded-full overflow-hidden", className)}
      style={{ width: size, height: size }}
    >
      {image ? (
        <Image src={image} alt={name} fill sizes={`${size}px`} className="object-cover" />
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
