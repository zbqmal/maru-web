import { apiRequest } from "@/lib/api/client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  birthday: string | null;
  profileImageKey: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export const login = (body: LoginInput) => apiRequest<AuthUser>("/login", { method: "POST", body });

export const register = (body: RegisterInput) =>
  apiRequest<AuthUser>("/register", { method: "POST", body });
