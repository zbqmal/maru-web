"use client";

import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Avatar from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorState from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { getErrorMessage } from "@/lib/api/errors";
import { getProfile, updateProfileBirthday, updateProfileName } from "@/lib/api/profile";
import { CURRENT_USER_QUERY_KEY } from "@/lib/auth/session";

export const PROFILE_QUERY_KEY = ["profile", "me"] as const;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const ProfileForm = () => {
  const queryClient = useQueryClient();
  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfile,
  });

  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [birthdayError, setBirthdayError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setName(profile.name);
    setBirthday(profile.birthday ?? "");
  }, [profile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNameError(null);
    setBirthdayError(null);
    setNotice(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setNameError("이름을 입력해주세요.");
      return;
    }

    if (trimmedName.length > 100) {
      setNameError("이름은 100자 이하여야 합니다.");
      return;
    }

    if (birthday && !DATE_REGEX.test(birthday)) {
      setBirthdayError("생일 형식이 올바르지 않습니다.");
      return;
    }

    if (!profile) {
      return;
    }

    const didNameChange = trimmedName !== profile.name;
    const didBirthdayChange = birthday !== (profile.birthday ?? "");

    if (!didNameChange && !didBirthdayChange) {
      setNotice({ type: "success", message: "변경된 내용이 없어요." });
      return;
    }

    setIsSubmitting(true);

    try {
      let updatedProfile = profile;

      if (didNameChange) {
        updatedProfile = await updateProfileName({ name: trimmedName });
      }

      if (didBirthdayChange) {
        updatedProfile = await updateProfileBirthday({ birthday: birthday || null });
      }

      queryClient.setQueryData(PROFILE_QUERY_KEY, updatedProfile);
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updatedProfile);
      setName(updatedProfile.name);
      setBirthday(updatedProfile.birthday ?? "");
      setNotice({ type: "success", message: "프로필이 저장되었어요." });
    } catch (error) {
      setNotice({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <LoadingSpinner label="프로필을 불러오는 중..." />
        </CardContent>
      </Card>
    );
  }

  if (isError || !profile) {
    return (
      <Card>
        <CardContent>
          <ErrorState
            title="프로필을 불러오지 못했어요"
            description="잠시 후 다시 시도해 주세요."
            onRetry={() => {
              void refetch();
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>기본 정보</CardTitle>
        <CardDescription>이름과 생일을 수정하고 계정 정보를 확인할 수 있어요.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-6">
          <section className="flex items-center justify-between rounded-lg border border-border bg-surface-muted/60 p-4">
            <div className="flex items-center gap-3">
              <Avatar fallback={profile.name} size="lg" />
              <div>
                <p className="text-sm font-semibold text-foreground">{profile.name}</p>
                <p className="text-xs text-muted-foreground">프로필 이미지는 추후 업데이트될 예정이에요.</p>
              </div>
            </div>
            <Button type="button" variant="outline" disabled>
              이미지 변경 (준비 중)
            </Button>
          </section>

          {notice && (
            <p
              role={notice.type === "error" ? "alert" : "status"}
              className={
                notice.type === "error"
                  ? "rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  : "rounded-lg bg-success/10 px-4 py-3 text-sm text-success"
              }
            >
              {notice.message}
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="profile-name" className="text-sm font-medium">
              이름
            </label>
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "profile-name-error" : undefined}
              maxLength={100}
            />
            {nameError && (
              <p id="profile-name-error" className="text-xs text-destructive">
                {nameError}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-email" className="text-sm font-medium">
              이메일
            </label>
            <Input id="profile-email" type="email" value={profile.email} readOnly disabled />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-birthday" className="text-sm font-medium">
              생일
            </label>
            <Input
              id="profile-birthday"
              type="date"
              value={birthday}
              onChange={(event) => setBirthday(event.target.value)}
              aria-invalid={!!birthdayError}
              aria-describedby={birthdayError ? "profile-birthday-error" : undefined}
            />
            {birthdayError && (
              <p id="profile-birthday-error" className="text-xs text-destructive">
                {birthdayError}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "저장하기"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ProfileForm;
