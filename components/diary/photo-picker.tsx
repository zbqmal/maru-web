"use client";

import { useId, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils/tailwind.utils";
import {
  ACCEPTED_DIARY_PHOTO_TYPES,
  MAX_DIARY_PHOTO_SIZE_BYTES,
  MAX_DIARY_PHOTOS_TO_UPLOAD,
} from "@/lib/constants/media.constants";
import { PhotoUploadState, SelectedPhoto } from "@/lib/types/media.types";
import { createPhotoId, formatSizeToMb } from "@/lib/utils/media.utils";

export interface PhotoPickerProps {
  photos: SelectedPhoto[];
  onAdd: (photos: SelectedPhoto[]) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
  maxPhotos?: number;
  error: string | null;
  onError: (message: string | null) => void;
  uploadStates?: Record<string, PhotoUploadState>;
}

const PhotoPicker = ({
  photos,
  onAdd,
  onRemove,
  disabled = false,
  maxPhotos = MAX_DIARY_PHOTOS_TO_UPLOAD,
  error,
  onError,
  uploadStates = {},
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

      if (!ACCEPTED_DIARY_PHOTO_TYPES.includes(file.type)) {
        rejectionReason = "JPG, PNG, WEBP 형식의 사진만 첨부할 수 있어요.";
        continue;
      }

      if (file.size > MAX_DIARY_PHOTO_SIZE_BYTES) {
        rejectionReason = `사진 용량은 최대 ${formatSizeToMb(MAX_DIARY_PHOTO_SIZE_BYTES)}MB까지 첨부할 수 있어요.`;
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
        {photos.map((photo, index) => {
          const uploadState = uploadStates[photo.id];
          const isBusy =
            uploadState?.status === "requesting" || uploadState?.status === "uploading";
          const statusLabel =
            uploadState?.status === "requesting"
              ? "업로드 준비 중"
              : uploadState?.status === "uploading"
                ? `업로드 ${uploadState.progress}%`
                : uploadState?.status === "uploaded"
                  ? "업로드 완료"
                  : uploadState?.status === "failed"
                    ? "업로드 실패"
                    : null;

          return (
            <div key={photo.id} className="flex w-20 shrink-0 flex-col gap-1">
              <div
                className={cn(
                  "group relative h-20 w-20 overflow-hidden rounded-lg border bg-surface-muted",
                  uploadState?.status === "failed" ? "border-destructive" : "border-border",
                  uploadState?.status === "uploaded" ? "ring-2 ring-success/40" : ""
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable remote image */}
                <img
                  src={photo.previewUrl}
                  alt={`첨부한 사진 미리보기 ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                {isBusy && (
                  <div className="absolute inset-0 flex items-end bg-black/35 p-1">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all"
                      style={{ width: `${Math.max(uploadState.progress, 8)}%` }}
                      role="progressbar"
                      aria-label={`사진 ${index + 1} 업로드 진행률`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={uploadState.progress}
                    />
                  </div>
                )}
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
              {statusLabel && (
                <span
                  className={cn(
                    "truncate text-center text-[10px]",
                    uploadState?.status === "failed" ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {statusLabel}
                </span>
              )}
            </div>
          );
        })}

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
        accept={ACCEPTED_DIARY_PHOTO_TYPES.join(",")}
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
        최대 {maxPhotos}장, 장당 {formatSizeToMb(MAX_DIARY_PHOTO_SIZE_BYTES)}MB까지 첨부할 수
        있어요.
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
