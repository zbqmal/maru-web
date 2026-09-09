"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff, Loader2, X } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogClose, DialogBody } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/tailwind.utils";
import type { DiaryPhoto } from "@/lib/api/diary";
import { getDiaryPhotoUrl } from "@/lib/utils/media.utils";

export interface PhotoGalleryProps {
  photos: DiaryPhoto[];
  /** Whether the current viewer may remove photos (owner only). */
  canRemove?: boolean;
  onRemove?: (photoId: string) => void;
  /** The id of a photo currently being removed, used to show a busy state. */
  removingPhotoId?: string | null;
  className?: string;
}

interface ThumbnailProps {
  photo: DiaryPhoto;
  index: number;
  canRemove: boolean;
  isRemoving: boolean;
  onSelect: () => void;
  onRemove: (photoId: string) => void;
}

const PhotoThumbnail = ({ photo, index, canRemove, isRemoving, onSelect, onRemove }: ThumbnailProps) => {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-muted">
      <button
        type="button"
        onClick={onSelect}
        className="absolute inset-0 h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`사진 ${index + 1} 크게 보기`}
      >
        {status === "error" ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImageOff className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px]">이미지를 불러올 수 없어요</span>
          </div>
        ) : (
          <>
            {status === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element -- remote media served from a runtime-configured S3/CDN origin */}
            <img
              src={getDiaryPhotoUrl(photo.storageKey)}
              alt={`다이어리 사진 ${index + 1}`}
              className={cn(
                "h-full w-full object-cover transition-transform group-hover:scale-105",
                status === "loaded" ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setStatus("loaded")}
              onError={() => setStatus("error")}
            />
          </>
        )}
      </button>

      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(photo.id)}
          disabled={isRemoving}
          aria-label={`사진 ${index + 1} 삭제`}
          className={cn(
            "absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full",
            "bg-black/60 text-white transition-opacity hover:bg-black/80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          {isRemoving ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          ) : (
            <X className="h-3 w-3" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
};

const PhotoGallery = ({
  photos,
  canRemove = false,
  onRemove,
  removingPhotoId = null,
  className,
}: PhotoGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  const orderedPhotos = [...photos].sort((a, b) => a.displayOrder - b.displayOrder);
  const selectedPhoto = selectedIndex !== null ? orderedPhotos[selectedIndex] : null;

  const showPrev = () =>
    setSelectedIndex((prev) => (prev === null ? prev : (prev - 1 + orderedPhotos.length) % orderedPhotos.length));
  const showNext = () =>
    setSelectedIndex((prev) => (prev === null ? prev : (prev + 1) % orderedPhotos.length));

  return (
    <div
      role="group"
      aria-label="첨부된 사진"
      className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}
    >
      {orderedPhotos.map((photo, index) => (
        <PhotoThumbnail
          key={photo.id}
          photo={photo}
          index={index}
          canRemove={canRemove}
          isRemoving={removingPhotoId === photo.id}
          onSelect={() => setSelectedIndex(index)}
          onRemove={(photoId) => onRemove?.(photoId)}
        />
      ))}

      <Dialog
        open={selectedPhoto !== null}
        onClose={() => setSelectedIndex(null)}
        className="max-w-2xl bg-transparent p-0 shadow-none"
        titleId="photo-gallery-dialog-title"
      >
        {selectedPhoto && (
          <div className="flex flex-col gap-3">
            <DialogHeader className="px-1">
              <DialogTitle id="photo-gallery-dialog-title" className="sr-only">
                사진 {(selectedIndex ?? 0) + 1} / {orderedPhotos.length}
              </DialogTitle>
              <DialogClose onClose={() => setSelectedIndex(null)} />
            </DialogHeader>
            <DialogBody className="relative flex items-center justify-center">
              {orderedPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={showPrev}
                  aria-label="이전 사진"
                  className="absolute left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element -- remote media served from a runtime-configured S3/CDN origin */}
              <img
                src={getDiaryPhotoUrl(selectedPhoto.storageKey)}
                alt={`다이어리 사진 ${(selectedIndex ?? 0) + 1}`}
                className="max-h-[70vh] w-full rounded-lg object-contain"
              />
              {orderedPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={showNext}
                  aria-label="다음 사진"
                  className="absolute right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </DialogBody>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default PhotoGallery;
