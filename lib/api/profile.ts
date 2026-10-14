import { apiRequest } from "@/lib/api/client";
import type { DiaryPhotoMimeType, PresignedUploadResponse } from "@/lib/api/diary";

export interface Profile {
  id: string;
  email: string;
  name: string;
  birthday: string | null;
  profileImageKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNameInput {
  name: string;
}

export interface UpdateBirthdayInput {
  birthday: string | null;
}

export const getProfile = () => apiRequest<Profile>("/profile");

export const updateProfileName = (body: UpdateNameInput) =>
  apiRequest<Profile>("/profile/name", { method: "PATCH", body });

export const updateProfileBirthday = (body: UpdateBirthdayInput) =>
  apiRequest<Profile>("/profile/birthday", { method: "PATCH", body });

export interface RequestProfileImageUploadInput {
  mimeType: DiaryPhotoMimeType;
  sizeBytes: number;
}

export interface UpdateProfileImageInput {
  storageKey: string;
  mimeType: DiaryPhotoMimeType;
}

export const requestProfileImageUpload = (body: RequestProfileImageUploadInput) =>
  apiRequest<PresignedUploadResponse>("/profile/image/upload-url", { method: "POST", body });

export const updateProfileImage = (body: UpdateProfileImageInput) =>
  apiRequest<Profile>("/profile/image", { method: "PATCH", body });

export const removeProfileImage = () => apiRequest<void>("/profile/image", { method: "DELETE" });
