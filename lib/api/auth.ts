import { apiRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

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

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export const login = (body: LoginInput) => apiRequest<AuthUser>("/login", { method: "POST", body });

export const register = (body: RegisterInput) =>
  apiRequest<AuthUser>("/register", { method: "POST", body });

export const getCurrentUser = async () => {
  try {
    return await apiRequest<AuthUser>("/me");
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }

    throw error;
  }
};

export const logout = () => apiRequest<void>("/logout", { method: "POST" });

export const forgotPassword = (body: ForgotPasswordInput) =>
  apiRequest<void>("/forgot-password", { method: "POST", body });

export const resetPassword = (body: ResetPasswordInput) =>
  apiRequest<void>("/reset-password", { method: "POST", body });
