import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCurrentBaby, resolveNoBabyDestination } from "@/lib/baby-utils";
import { db } from "@/db";
import { album, albumStep, step } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { GalleryClient } from "./gallery-client";
import type { AlbumWithMeta } from "@/types";

interface GalleryPageProps {
  searchParams: Promise<{ album?: string; tab?: string }>;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth");

  const currentBaby = await getCurrentBaby(session.user.id);
  if (!currentBaby) redirect(await resolveNoBabyDestination(session.user.id));

  const coverStep = step;
  const [{ album: albumIdParam, tab: tabParam }, allSteps, albumRows] = await Promise.all([
    searchParams,
    db.select().from(step).where(eq(step.babyId, currentBaby.id)).orderBy(desc(step.date)),
    db
      .select({
        id: album.id,
        name: album.name,
        createdAt: album.createdAt,
        coverPhotoUrl: coverStep.photoUrl,
        photoCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${albumStep}
          WHERE ${albumStep.albumId} = ${album.id}
        )`.as("photo_count"),
      })
      .from(album)
      .leftJoin(coverStep, eq(album.coverStepId, coverStep.id))
      .where(eq(album.babyId, currentBaby.id))
      .orderBy(desc(album.createdAt)),
  ]);

  const albums: AlbumWithMeta[] = albumRows.map((a) => ({
    id: a.id,
    name: a.name,
    coverPhotoUrl: a.coverPhotoUrl,
    photoCount: Number(a.photoCount),
    createdAt: a.createdAt,
  }));

  let activeAlbum: { id: string; name: string; stepIds: string[] } | null = null;
  if (albumIdParam) {
    const matched = albums.find((a) => a.id === albumIdParam);
    if (matched) {
      const memberRows = await db
        .select({ stepId: albumStep.stepId })
        .from(albumStep)
        .where(eq(albumStep.albumId, albumIdParam));
      activeAlbum = {
        id: matched.id,
        name: matched.name,
        stepIds: memberRows.map((r) => r.stepId),
      };
    }
  }

  // Stale or invalid album link → land in Albums tab (so user sees their list,
  // not the full photo gallery).
  const initialTab =
    albumIdParam && !activeAlbum ? "albums" : tabParam === "albums" ? "albums" : "photos";

  return (
    <GalleryClient
      steps={allSteps}
      baby={currentBaby}
      albums={albums}
      activeAlbum={activeAlbum}
      initialTab={initialTab}
    />
  );
}
