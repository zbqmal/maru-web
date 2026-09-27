import { DiaryPhoto } from "@/lib/api/diary";
import { cn } from "@/lib/utils/tailwind.utils";
import { ImageOff, Loader2, X } from "lucide-react";
import { useState } from "react";

interface PhotoThumbnailProps {
  photo: DiaryPhoto;
  index: number;
  canRemove: boolean;
  isRemoving: boolean;
  onSelect: () => void;
  onRemove: (photoId: string) => void;
}

export const PhotoThumbnail = ({
  photo,
  index,
  canRemove,
  isRemoving,
  onSelect,
  onRemove,
}: PhotoThumbnailProps) => {
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
                <Loader2
                  className="h-5 w-5 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element -- remote media served from a runtime-configured S3/CDN origin */}
            <img
              src={photo.url}
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
