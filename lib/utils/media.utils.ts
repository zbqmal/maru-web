import { DiaryPhotoMimeType } from "../api/diary";
import { ImageDimensions } from "../types/media.types";

export const isDiaryPhotoMimeType = (mimeType: string): mimeType is DiaryPhotoMimeType =>
  mimeType === "image/jpeg" || mimeType === "image/png" || mimeType === "image/webp";

export const formatSizeToMb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(0);

export const createPhotoId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Reads the pixel dimensions of an in-browser image file before it's registered with the backend. */
export const getImageDimensions = (file: File): Promise<ImageDimensions> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = image;
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("사진 크기를 확인하지 못했어요."));
    };

    image.src = objectUrl;
  });
