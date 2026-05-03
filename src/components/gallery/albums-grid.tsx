"use client";

import { motion } from "framer-motion";
import { FolderHeart } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { AlbumFolderCard } from "./album-folder-card";
import type { AlbumWithMeta } from "@/types";

interface AlbumsGridProps {
  albums: AlbumWithMeta[];
  onRename: (album: AlbumWithMeta) => void;
  onDelete: (album: AlbumWithMeta) => void;
}

export function AlbumsGrid({ albums, onRename, onDelete }: AlbumsGridProps) {
  if (albums.length === 0) {
    return (
      <EmptyState
        icon={FolderHeart}
        title="No albums yet"
        description="Tap “New Album” to group your favorite memories into a folder."
      />
    );
  }

  return (
    <motion.div
      className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2"
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
    >
      {albums.map((album) => (
        <AlbumFolderCard key={album.id} album={album} onRename={onRename} onDelete={onDelete} />
      ))}
    </motion.div>
  );
}
