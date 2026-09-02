"use client";

import { useId, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const MAX_PHOTOS = 3;
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export interface SelectedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

export interface PhotoPickerProps {
  photos: SelectedPhoto[];
  onAdd: (photos: SelectedPhoto[]) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
  maxPhotos?: number;
  error: string | null;
  onError: (message: string | null) => void;
}

const createPhotoId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const formatSizeMb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(0);

const PhotoPicker = ({
  photos,
  onAdd,
  onRemove,
  disabled = false,
  maxPhotos = MAX_PHOTOS,
  error,
  onError,
}: PhotoPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const isFull = photos.length >= maxPhotos;

  const handleAddClick = () => {
    inputRef.current?.click();
  };

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const remainingSlots = maxPhotos - photos.length;
    const accepted: SelectedPhoto[] = [];
    let rejectionReason: string | null = null;

    for (const file of files) {
      if (accepted.length >= remainingSlots) {
        rejectionReason = `사진은 최대 ${maxPhotos}장까지 첨부할 수 있어요.`;
        break;
      }

      if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
        rejectionReason = "JPG, PNG, WEBP, GIF 형식의 사진만 첨부할 수 있어요.";
        continue;
      }

      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        rejectionReason = `사진 용량은 최대 ${formatSizeMb(MAX_PHOTO_SIZE_BYTES)}MB까지 첨부할 수 있어요.`;
        continue;
      }

      accepted.push({
        id: createPhotoId(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    onError(rejectionReason);

    if (accepted.length > 0) {
      onAdd(accepted);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable remote image */}
            <img
              src={photo.previewUrl}
              alt={`첨부한 사진 미리보기 ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove(photo.id)}
              disabled={disabled}
              aria-label={`사진 ${index + 1} 삭제`}
              className={cn(
                "absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full",
                "bg-black/60 text-white transition-opacity hover:bg-black/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-50"
              )}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        ))}

        {!isFull && (
          <button
            type="button"
            onClick={handleAddClick}
            disabled={disabled}
            aria-label="사진 추가"
            className={cn(
              "flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border",
              "text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
            <span className="text-[11px]">사진 추가</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_PHOTO_TYPES.join(",")}
        multiple
        disabled={disabled}
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          // Allow re-selecting the same file after removal.
          e.target.value = "";
        }}
        className="sr-only"
        aria-label="사진 첨부하기"
      />

      <p className="text-xs text-muted-foreground">
        최대 {maxPhotos}장, 장당 {formatSizeMb(MAX_PHOTO_SIZE_BYTES)}MB까지 첨부할 수 있어요.
      </p>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};

export default PhotoPicker;
