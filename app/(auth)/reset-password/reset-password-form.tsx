"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/api/auth";
import { ApiError, getErrorMessage } from "@/lib/api/errors";
import { PASSWORD_PATTERN } from "@/lib/auth/auth";

const validatePassword = (password: string): string | undefined => {
  if (!password) return "비밀번호를 입력해주세요.";
  if (password.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
  if (!PASSWORD_PATTERN.test(password))
    return "비밀번호는 영문 대·소문자, 숫자, 특수문자를 각각 포함해야 합니다.";
  return undefined;
};

const isInvalidTokenError = (err: unknown): boolean => {
  if (err instanceof ApiError) {
    return err.status === 400 || err.status === 404;
  }
  return false;
};

type ResetState = "idle" | "success" | "invalid-token";

const ResetPasswordForm = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetState, setResetState] = useState<ResetState>("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    setServerError(null);

    const error = validatePassword(newPassword);
    setPasswordError(error);
    if (error) return;

    setIsSubmitting(true);
    try {
      await resetPassword({ token, newPassword });
      setResetState("success");
    } catch (err) {
      if (isInvalidTokenError(err)) {
        setResetState("invalid-token");
      } else {
        setServerError(getErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <h1 className="text-2xl font-bold">유효하지 않은 링크</h1>
        <p className="text-sm text-muted-foreground">
          비밀번호 재설정 링크가 올바르지 않거나 만료되었습니다.
          <br />
          다시 요청하시려면 아래 링크를 이용해주세요.
        </p>
        <Link
          href="/forgot-password"
          className="mt-2 text-sm font-medium text-primary hover:underline"
        >
          비밀번호 재설정 다시 요청하기
        </Link>
      </div>
    );
  }

  if (resetState === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <CheckCircle className="h-12 w-12 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-bold">비밀번호가 변경되었습니다</h1>
        <p className="text-sm text-muted-foreground">새 비밀번호로 로그인할 수 있습니다.</p>
        <Link href="/login" className="mt-2 text-sm font-medium text-primary hover:underline">
          로그인하기
        </Link>
      </div>
    );
  }

  if (resetState === "invalid-token") {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <h1 className="text-2xl font-bold">링크가 만료되었습니다</h1>
        <p className="text-sm text-muted-foreground">
          비밀번호 재설정 링크가 만료되었거나 이미 사용되었습니다.
          <br />새 링크를 요청해주세요.
        </p>
        <Link
          href="/forgot-password"
          className="mt-2 text-sm font-medium text-primary hover:underline"
        >
          비밀번호 재설정 다시 요청하기
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-center text-2xl font-bold">새 비밀번호 설정</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        새로 사용할 비밀번호를 입력해주세요.
      </p>

      {serverError && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {serverError}
        </p>
      )}

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-password" className="text-sm font-medium">
            새 비밀번호
          </label>
          <Input
            id="new-password"
            type={showPassword ? "text" : "password"}
            placeholder="새 비밀번호를 입력하세요"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? "password-error" : undefined}
            startIcon={<Lock className="h-4 w-4" />}
            endIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                className="cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          {passwordError && (
            <p id="password-error" className="text-xs text-destructive">
              {passwordError}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            영문 대·소문자, 숫자, 특수문자를 포함한 8자 이상
          </p>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "변경 중..." : "비밀번호 변경"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
};

export default ResetPasswordForm;
