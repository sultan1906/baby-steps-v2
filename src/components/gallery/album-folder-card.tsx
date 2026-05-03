"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AlbumWithMeta } from "@/types";

interface AlbumFolderCardProps {
  album: AlbumWithMeta;
  onRename: (album: AlbumWithMeta) => void;
  onDelete: (album: AlbumWithMeta) => void;
}

export function AlbumFolderCard({ album, onRename, onDelete }: AlbumFolderCardProps) {
  const router = useRouter();

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.92 },
        visible: { opacity: 1, scale: 1 },
      }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="relative group"
    >
      {/* Folder tab silhouette */}
      <div className="absolute -top-1 left-2 w-8 h-2 rounded-t-md bg-rose-100" />

      <button
        type="button"
        onClick={() => router.push(`/gallery?album=${album.id}`)}
        className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white border border-stone-100 shadow-sm hover:shadow-md transition cursor-pointer text-left"
      >
        <div className="absolute inset-0">
          {album.coverPhotoUrl ? (
            <Image
              src={album.coverPhotoUrl}
              alt={album.name}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full gradient-bg" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-2 text-left">
          <h3 className="text-white font-semibold text-xs truncate drop-shadow">{album.name}</h3>
          <p className="text-white/80 text-[10px] leading-tight">
            {album.photoCount} {album.photoCount === 1 ? "photo" : "photos"}
          </p>
        </div>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Album actions"
          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-stone-600 shadow flex items-center justify-center backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6}>
          <DropdownMenuItem onClick={() => onRename(album)}>
            <Pencil className="w-4 h-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(album)}>
            <Trash2 className="w-4 h-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
