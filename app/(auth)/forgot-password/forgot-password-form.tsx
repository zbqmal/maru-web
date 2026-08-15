"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPassword } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/errors";

const validateEmail = (email: string): string | undefined => {
  if (!email) return "이메일을 입력해주세요.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "올바른 이메일 형식이 아닙니다.";
  return undefined;
};

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

    const error = validateEmail(email);
    setEmailError(error);
    if (error) return;

    setIsSubmitting(true);
    try {
      await forgotPassword({ email });
      setSubmitted(true);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <CheckCircle className="h-12 w-12 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-bold">이메일을 확인해주세요</h1>
        <p className="text-sm text-muted-foreground">
          입력하신 이메일 주소로 비밀번호 재설정 안내를 보내드렸습니다.
          <br />
          이메일이 도착하지 않는다면 스팸함을 확인해주세요.
        </p>
        <Link href="/login" className="mt-2 text-sm font-medium text-primary hover:underline">
          로그인으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-center text-2xl font-bold">비밀번호 찾기</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        가입 시 사용한 이메일을 입력하시면 재설정 링크를 보내드립니다.
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
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-error" : undefined}
            startIcon={<Mail className="h-4 w-4" />}
          />
          {emailError && (
            <p id="email-error" className="text-xs text-destructive">
              {emailError}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "전송 중..." : "재설정 링크 보내기"}
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

export default ForgotPasswordForm;
