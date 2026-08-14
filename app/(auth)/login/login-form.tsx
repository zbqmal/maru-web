"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api/auth";
import { CURRENT_USER_QUERY_KEY } from "@/lib/auth/session";
import { getErrorMessage } from "@/lib/api/errors";

interface FieldErrors {
  email?: string;
  password?: string;
}

const validateLoginForm = (email: string, password: string): FieldErrors => {
  const errors: FieldErrors = {};
  if (!email) {
    errors.email = "이메일을 입력해주세요.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "올바른 이메일 형식이 아닙니다.";
  }
  if (!password) {
    errors.password = "비밀번호를 입력해주세요.";
  }
  return errors;
};

const LoginForm = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

    const errors = validateLoginForm(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const currentUser = await login({ email, password });
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, currentUser);
      router.push("/diary");
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-1 text-center text-2xl font-bold">로그인</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        계정이 없으신가요?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          회원가입
        </Link>
      </p>

      {serverError && (
        <p role="alert" className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            이메일
          </label>
          <Input
            id="email"
            type="email"
            placeholder="이메일을 입력하세요"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            startIcon={<Mail className="h-4 w-4" />}
          />
          {fieldErrors.email && (
            <p id="email-error" className="text-xs text-destructive">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            비밀번호
          </label>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
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
          {fieldErrors.password && (
            <p id="password-error" className="text-xs text-destructive">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Options row */}
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" className="accent-primary" />
            로그인 상태 유지
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            비밀번호 찾기
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "로그인 중..." : "로그인"}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3 text-xs text-muted">
          <div className="h-px flex-1 bg-border" />
          또는
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Social buttons — deferred to social auth milestone */}
        <Button type="button" variant="outline" size="lg" className="w-full gap-3" disabled>
          <GoogleIcon />
          Google로 계속하기
        </Button>
        <Button type="button" variant="outline" size="lg" className="w-full gap-3" disabled>
          <AppleIcon />
          Apple로 계속하기
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;

const GoogleIcon = () => {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
};

const AppleIcon = () => {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
};
