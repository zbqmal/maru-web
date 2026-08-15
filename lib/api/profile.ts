import { apiRequest } from "@/lib/api/client";

export interface Profile {
  id: string;
  email: string;
  name: string;
  birthday: string | null;
  profileImageKey: Record<string, unknown> | null;
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
