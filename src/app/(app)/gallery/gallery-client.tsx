"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Grid3x3,
  List,
  Award,
  MapPin,
  Calendar,
  Play,
  Plus,
  Check,
  Star,
  ChevronLeft,
  Pencil,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import { BackButton } from "@/components/shared/back-button";
import { EmptyState } from "@/components/shared/empty-state";
import { MemoryDetailModal } from "@/components/memory/memory-detail-modal";
import { AlbumsGrid } from "@/components/gallery/albums-grid";
import { SelectModeActionBar } from "@/components/gallery/select-mode-action-bar";
import { NewAlbumNameDialog } from "@/components/gallery/new-album-name-dialog";
import { RenameAlbumDialog } from "@/components/gallery/rename-album-dialog";
import { DeleteAlbumDialog } from "@/components/gallery/delete-album-dialog";
import { cn } from "@/lib/utils";
import { formatShortDate, getDayNumber, getMonthBuckets } from "@/lib/date-utils";
import { parseISO } from "date-fns";
import { createAlbum, renameAlbum, deleteAlbum } from "@/actions/albums";
import type { Step, Baby, AlbumWithMeta } from "@/types";

type Tab = "photos" | "albums";
type ViewMode = "grid" | "list";
type CreateMode = "off" | "select-photos" | "select-cover";

interface GalleryClientProps {
  steps: Step[];
  baby: Baby;
  albums: AlbumWithMeta[];
  activeAlbum: { id: string; name: string; stepIds: string[] } | null;
  initialTab: Tab;
}

export function GalleryClient({
  steps,
  baby,
  albums,
  activeAlbum,
  initialTab,
}: GalleryClientProps) {
  const { push, refresh } = useRouter();

  const [tab, setTab] = useState<Tab>(initialTab);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [monthFilter, setMonthFilter] = useState<string | "all">("all");
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);

  const [createMode, setCreateMode] = useState<CreateMode>("off");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [coverId, setCoverId] = useState<string | null>(null);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);

  const [renameTarget, setRenameTarget] = useState<AlbumWithMeta | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AlbumWithMeta | null>(null);

  const albumStepIds = useMemo(
    () => (activeAlbum ? new Set(activeAlbum.stepIds) : null),
    [activeAlbum]
  );

  const monthBuckets = useMemo(() => getMonthBuckets(steps), [steps]);
  // Derive the effective filter so a selected month that disappears
  // (e.g. its photos were deleted) falls back to "all" without syncing state.
  const effectiveMonthFilter =
    monthFilter === "all" || monthBuckets.some((m) => m.key === monthFilter) ? monthFilter : "all";
  const activeMonthLabel = useMemo(
    () =>
      effectiveMonthFilter === "all"
        ? null
        : (monthBuckets.find((m) => m.key === effectiveMonthFilter)?.label ?? null),
    [monthBuckets, effectiveMonthFilter]
  );

  // Photos shown in the main Photos tab (no album filter — that's a separate view)
  const photosToShow = useMemo(
    () =>
      effectiveMonthFilter === "all"
        ? steps
        : steps.filter((s) => s.date.slice(0, 7) === effectiveMonthFilter),
    [steps, effectiveMonthFilter]
  );

  // In select-cover mode, only show selected photos
  const selectionPhotos = useMemo(
    () => steps.filter((s) => selectedIds.has(s.id)),
    [steps, selectedIds]
  );

  function exitCreateMode() {
    setCreateMode("off");
    setSelectedIds(new Set());
    setCoverId(null);
    setNameDialogOpen(false);
  }

  function startCreateAlbum() {
    if (activeAlbum) {
      push("/gallery");
    }
    setTab("albums");
    setCreateMode("select-photos");
    setSelectedIds(new Set());
    setCoverId(null);
  }

  function togglePhotoSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function goToCoverStep() {
    if (selectedIds.size === 0) return;
    const first = Array.from(selectedIds)[0];
    setCoverId(first);
    setCreateMode("select-cover");
  }

  function backToPhotosStep() {
    setCreateMode("select-photos");
  }

  function openNameDialog() {
    if (!coverId) return;
    setNameDialogOpen(true);
  }

  async function handleCreateAlbum(name: string) {
    if (!coverId || selectedIds.size === 0) return;
    try {
      await createAlbum({
        name,
        stepIds: Array.from(selectedIds),
        coverStepId: coverId,
      });
      exitCreateMode();
      setTab("albums");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create album. Try again.");
    }
  }

  async function handleRename(name: string) {
    if (!renameTarget) return;
    try {
      await renameAlbum(renameTarget.id, name);
      setRenameTarget(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't rename album. Try again.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteAlbum(deleteTarget.id);
      setDeleteTarget(null);
      if (activeAlbum?.id === deleteTarget.id) {
        push("/gallery?tab=albums");
      } else {
        refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete album. Try again.");
    }
  }

  function exitAlbumDetail() {
    push("/gallery?tab=albums");
  }

  // What grid renders in select modes vs normal browse
  const showSelectableGrid = createMode !== "off";
  const gridSource: Step[] = createMode === "select-cover" ? selectionPhotos : steps;

  // ── Dedicated album-detail view ────────────────────────────────────────────
  if (activeAlbum && createMode === "off") {
    const albumMeta = albums.find((a) => a.id === activeAlbum.id);
    const albumPhotos = steps.filter((s) => albumStepIds!.has(s.id));

    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-stone-100/50">
          <div className="flex items-center justify-between px-4 py-3 pr-8 gap-3">
            <button
              type="button"
              onClick={exitAlbumDetail}
              aria-label="Back to albums"
              className="size-9 rounded-full bg-white border border-stone-200 hover:bg-stone-50 flex items-center justify-center text-stone-600 transition"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-stone-800 text-lg truncate">{activeAlbum.name}</h1>
              <p className="text-xs text-stone-500">
                {albumPhotos.length} {albumPhotos.length === 1 ? "photo" : "photos"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => albumMeta && setRenameTarget(albumMeta)}
                aria-label="Rename album"
                className="size-9 rounded-full bg-white border border-stone-200 hover:bg-stone-50 flex items-center justify-center text-stone-600 transition"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => albumMeta && setDeleteTarget(albumMeta)}
                aria-label="Delete album"
                className="size-9 rounded-full bg-white border border-stone-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 flex items-center justify-center text-stone-600 transition"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 pb-32">
          {albumPhotos.length === 0 ? (
            <EmptyState
              icon={Grid3x3}
              title="This album is empty"
              description="Photos in this album will appear here."
            />
          ) : (
            <div key={`album-${activeAlbum.id}`} className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {albumPhotos.map((s) => (
                <m.div
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  onClick={() => setSelectedStep(s)}
                  className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer"
                >
                  {s.photoUrl ? (
                    s.type === "video" ? (
                      <>
                        <video
                          src={s.photoUrl}
                          poster={s.posterUrl ?? undefined}
                          preload="metadata"
                          playsInline
                          muted
                          className="absolute inset-0 size-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute bottom-2 left-2 size-7 rounded-full bg-black/50 flex items-center justify-center">
                          <Play className="size-3.5 text-white fill-white" />
                        </div>
                      </>
                    ) : (
                      <Image
                        src={s.photoUrl}
                        alt={s.title ?? s.date}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        loading="eager"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    )
                  ) : (
                    <div className="size-full gradient-bg" />
                  )}
                  {s.isMajor && (
                    <div className="absolute top-3 right-3 size-8 rounded-2xl gradient-bg flex items-center justify-center shadow">
                      <Award className="size-3.5 text-white" />
                    </div>
                  )}
                </m.div>
              ))}
            </div>
          )}
        </div>

        {selectedStep && (
          <MemoryDetailModal
            step={selectedStep}
            baby={baby}
            open={!!selectedStep}
            onClose={() => setSelectedStep(null)}
          />
        )}

        {renameTarget && (
          <RenameAlbumDialog
            open={!!renameTarget}
            onOpenChange={(open) => !open && setRenameTarget(null)}
            initialName={renameTarget.name}
            onSubmit={handleRename}
          />
        )}
        {deleteTarget && (
          <DeleteAlbumDialog
            open={!!deleteTarget}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            albumName={deleteTarget.name}
            onConfirm={handleDelete}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-stone-100/50">
        <div className="flex items-center justify-between px-4 py-3 pr-8">
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="font-semibold text-stone-800 text-lg">Memory Gallery</h1>
          </div>

          {/* Right slot: view toggle (Photos tab) or New Album (Albums tab, browse only) */}
          {tab === "photos" && createMode === "off" && (
            <div className="flex items-center bg-stone-50 rounded-xl p-1 gap-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "size-8 flex items-center justify-center rounded-lg transition-all",
                  viewMode === "grid" ? "bg-white shadow text-stone-700" : "text-stone-400"
                )}
              >
                <Grid3x3 className="size-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "size-8 flex items-center justify-center rounded-lg transition-all",
                  viewMode === "list" ? "bg-white shadow text-stone-700" : "text-stone-400"
                )}
              >
                <List className="size-4" />
              </button>
            </div>
          )}
          {tab === "albums" && createMode === "off" && (
            <button
              type="button"
              onClick={startCreateAlbum}
              className="flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold text-white shadow gradient-bg-vibrant hover:opacity-90 transition"
            >
              <Plus className="size-4" />
              New Album
            </button>
          )}
        </div>

        {/* Tab pills */}
        {createMode === "off" && (
          <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-hide">
            {(["photos", "albums"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all",
                  tab === t
                    ? "gradient-bg-vibrant text-white shadow"
                    : "bg-white border border-stone-200 text-stone-600"
                )}
              >
                {t === "photos" ? "Photos" : "Albums"}
              </button>
            ))}
          </div>
        )}

        {/* Month filter pills (Photos tab, browse only, only when months exist) */}
        {tab === "photos" && createMode === "off" && monthBuckets.length > 0 && (
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
            <button
              key="all-months"
              onClick={() => setMonthFilter("all")}
              className={cn(
                "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                effectiveMonthFilter === "all"
                  ? "gradient-bg-vibrant text-white shadow"
                  : "bg-white border border-stone-200 text-stone-600"
              )}
            >
              All months
            </button>
            {monthBuckets.map((m) => (
              <button
                key={m.key}
                onClick={() => setMonthFilter(m.key)}
                className={cn(
                  "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  effectiveMonthFilter === m.key
                    ? "gradient-bg-vibrant text-white shadow"
                    : "bg-white border border-stone-200 text-stone-600"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* Select-mode header strip */}
        {createMode !== "off" && (
          <div className="px-4 pb-3 pt-1">
            <p className="text-sm font-semibold text-stone-700">
              {createMode === "select-photos"
                ? "Choose photos for the album"
                : "Choose a cover photo"}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">
              {createMode === "select-photos"
                ? "Tap photos to add them"
                : "Tap one of the selected photos to feature on the album"}
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-32">
        {/* Albums tab — folder grid */}
        {tab === "albums" && createMode === "off" && (
          <AlbumsGrid
            albums={albums}
            onRename={(a) => setRenameTarget(a)}
            onDelete={(a) => setDeleteTarget(a)}
          />
        )}

        {/* Selectable photo grid (select-photos / select-cover) */}
        {showSelectableGrid && (
          <div key={`select-${createMode}`} className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
            {gridSource.map((s) => {
              const isSelected = selectedIds.has(s.id);
              const isCover = coverId === s.id;
              const onTap = () => {
                if (createMode === "select-photos") togglePhotoSelection(s.id);
                else setCoverId(s.id);
              };
              return (
                <m.button
                  type="button"
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  onClick={onTap}
                  className={cn(
                    "aspect-square rounded-xl overflow-hidden relative cursor-pointer outline-none",
                    createMode === "select-cover" && isCover && "ring-2 ring-rose-400"
                  )}
                >
                  {s.photoUrl ? (
                    s.type === "video" ? (
                      <video
                        src={s.photoUrl}
                        poster={s.posterUrl ?? undefined}
                        preload="metadata"
                        playsInline
                        muted
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : (
                      <Image
                        src={s.photoUrl}
                        alt={s.title ?? s.date}
                        fill
                        sizes="(max-width: 640px) 33vw, 25vw"
                        className="object-cover"
                      />
                    )
                  ) : (
                    <div className="size-full gradient-bg" />
                  )}

                  {/* Dim overlay on unselected (select-photos) */}
                  {createMode === "select-photos" && !isSelected && (
                    <div className="absolute inset-0 bg-white/30" />
                  )}

                  {/* Checkbox circle for select-photos */}
                  {createMode === "select-photos" && (
                    <div
                      className={cn(
                        "absolute top-1 right-1 size-5 rounded-full flex items-center justify-center border transition",
                        isSelected
                          ? "gradient-bg-vibrant border-white text-white shadow"
                          : "bg-white/80 border-white/90 text-transparent"
                      )}
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </div>
                  )}

                  {/* Star indicator for cover */}
                  {createMode === "select-cover" && isCover && (
                    <div className="absolute top-1 right-1 size-5 rounded-full gradient-bg-vibrant flex items-center justify-center text-white shadow">
                      <Star className="size-3 fill-white" />
                    </div>
                  )}
                </m.button>
              );
            })}
          </div>
        )}

        {/* Photos tab — browse mode */}
        {tab === "photos" && createMode === "off" && (
          <>
            {photosToShow.length === 0 ? (
              <EmptyState
                icon={Grid3x3}
                title={activeMonthLabel ? `No photos in ${activeMonthLabel}` : "No memories yet"}
                description={
                  activeMonthLabel
                    ? `Try another month or pick "All months".`
                    : "Start adding memories to see them here."
                }
              />
            ) : viewMode === "grid" ? (
              <div
                key={`grid-${effectiveMonthFilter}`}
                className="grid grid-cols-3 sm:grid-cols-4 gap-2"
              >
                {photosToShow.map((s) => (
                  <m.div
                    key={s.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    onClick={() => setSelectedStep(s)}
                    className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer"
                  >
                    {s.photoUrl ? (
                      s.type === "video" ? (
                        <>
                          <video
                            src={s.photoUrl}
                            poster={s.posterUrl ?? undefined}
                            preload="metadata"
                            playsInline
                            muted
                            className="absolute inset-0 size-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute bottom-2 left-2 size-7 rounded-full bg-black/50 flex items-center justify-center">
                            <Play className="size-3.5 text-white fill-white" />
                          </div>
                        </>
                      ) : (
                        <Image
                          src={s.photoUrl}
                          alt={s.title ?? s.date}
                          fill
                          sizes="(max-width: 640px) 50vw, 33vw"
                          loading="eager"
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      )
                    ) : (
                      <div className="size-full gradient-bg" />
                    )}
                    {s.isMajor && (
                      <div className="absolute top-3 right-3 size-8 rounded-2xl gradient-bg flex items-center justify-center shadow">
                        <Award className="size-3.5 text-white" />
                      </div>
                    )}
                  </m.div>
                ))}
              </div>
            ) : (
              <div key={`list-${effectiveMonthFilter}`} className="flex flex-col gap-3">
                {photosToShow.map((s) => (
                  <m.div
                    key={s.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    onClick={() => setSelectedStep(s)}
                    className="flex gap-4 bg-white rounded-3xl p-4 items-center border border-stone-100/50 cursor-pointer hover:border-rose-200 transition-colors"
                  >
                    <div className="size-20 rounded-2xl overflow-hidden relative flex-shrink-0">
                      {s.photoUrl ? (
                        s.type === "video" ? (
                          <>
                            <video
                              src={s.photoUrl}
                              poster={s.posterUrl ?? undefined}
                              preload="metadata"
                              playsInline
                              muted
                              className="absolute inset-0 size-full object-cover"
                            />
                            <div className="absolute bottom-1 left-1 size-5 rounded-full bg-black/50 flex items-center justify-center">
                              <Play className="size-2.5 text-white fill-white" />
                            </div>
                          </>
                        ) : (
                          <Image
                            src={s.photoUrl}
                            alt=""
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        )
                      ) : (
                        <div className="size-full gradient-bg" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs bg-stone-50 text-stone-600 px-2 py-0.5 rounded-lg font-medium">
                          <Calendar className="size-3 inline mr-1" />
                          {formatShortDate(s.date)}
                        </span>
                        {s.isMajor && (
                          <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg font-medium">
                            Milestone
                          </span>
                        )}
                      </div>
                      {s.locationNickname && (
                        <div className="flex items-center gap-1 text-sm text-stone-500">
                          <MapPin className="size-3" />
                          {s.locationNickname}
                        </div>
                      )}
                      {s.caption && (
                        <p className="text-sm text-stone-600 mt-1 truncate">{s.caption}</p>
                      )}
                      <div className="text-xs text-stone-400 mt-1">
                        Day {getDayNumber(parseISO(baby.birthdate), parseISO(s.date))}
                      </div>
                    </div>
                  </m.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Memory detail modal (only when not selecting) */}
      {selectedStep && createMode === "off" && (
        <MemoryDetailModal
          step={selectedStep}
          baby={baby}
          open={!!selectedStep}
          onClose={() => setSelectedStep(null)}
        />
      )}

      {/* Select-mode action bar */}
      <AnimatePresence>
        {createMode === "select-photos" && (
          <SelectModeActionBar
            key="bar-photos"
            message={`${selectedIds.size} selected`}
            primaryLabel="Next"
            primaryDisabled={selectedIds.size === 0}
            onPrimary={goToCoverStep}
            secondaryLabel="Cancel"
            onSecondary={exitCreateMode}
          />
        )}
        {createMode === "select-cover" && (
          <SelectModeActionBar
            key="bar-cover"
            message={coverId ? "Cover selected" : "Pick a cover"}
            primaryLabel="Next"
            primaryDisabled={!coverId}
            onPrimary={openNameDialog}
            secondaryLabel="Back"
            onSecondary={backToPhotosStep}
          />
        )}
      </AnimatePresence>

      {/* Name dialog */}
      <NewAlbumNameDialog
        open={nameDialogOpen}
        onOpenChange={setNameDialogOpen}
        onSubmit={handleCreateAlbum}
        selectedCount={selectedIds.size}
      />

      {/* Rename / Delete dialogs */}
      {renameTarget && (
        <RenameAlbumDialog
          open={!!renameTarget}
          onOpenChange={(open) => !open && setRenameTarget(null)}
          initialName={renameTarget.name}
          onSubmit={handleRename}
        />
      )}
      {deleteTarget && (
        <DeleteAlbumDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          albumName={deleteTarget.name}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
