import { DiaryPhotoMimeType } from "../api/diary";

export const isDiaryPhotoMimeType = (mimeType: string): mimeType is DiaryPhotoMimeType =>
  mimeType === "image/jpeg" || mimeType === "image/png" || mimeType === "image/webp";

export const formatSizeToMb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(0);

export const createPhotoId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
