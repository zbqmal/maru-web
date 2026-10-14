"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import Avatar from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  type Profile,
  requestProfileImageUpload,
  updateProfileImage,
  removeProfileImage,
} from "@/lib/api/profile";
import { getErrorMessage } from "@/lib/api/errors";
import { uploadFileToPresignedUrl } from "@/lib/api/uploads";
import { CURRENT_USER_QUERY_KEY } from "@/lib/auth/session";
import { GROUPS_QUERY_KEY } from "@/hooks/use-groups";
import {
  ACCEPTED_DIARY_PHOTO_TYPES,
  MAX_DIARY_PHOTO_SIZE_BYTES,
} from "@/lib/constants/media.constants";
import { isDiaryPhotoMimeType } from "@/lib/utils/media.utils";
import { getProfileImageUrl } from "@/lib/utils/profile-image.utils";

export const PROFILE_QUERY_KEY = ["profile", "me"] as const;

interface ProfileImageControlProps {
  profile: Profile;
  disabled?: boolean;
  onBusyChange: (busy: boolean) => void;
}

const ProfileImageControl = ({
  profile,
  disabled = false,
  onBusyChange,
}: ProfileImageControlProps) => {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<{ file: File; url: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [notice, setNotice] = useState<{ error: boolean; message: string } | null>(null);
  const [confirmRemoval, setConfirmRemoval] = useState(false);

  useEffect(() => {
    return () => {
      if (selected) URL.revokeObjectURL(selected.url);
    };
  }, [selected]);

  const mutation = useMutation({
    mutationFn: async (action: "upload" | "remove") => {
      if (action === "remove") {
        await removeProfileImage();
        return { ...profile, profileImageKey: null };
      }
      if (!selected) {
        throw new Error("프로필 이미지를 선택해주세요.");
      }
      const { file } = selected;
      if (!isDiaryPhotoMimeType(file.type)) {
        throw new Error("JPG, PNG, WEBP 형식의 이미지만 선택할 수 있어요.");
      }
      const upload = await requestProfileImageUpload({ mimeType: file.type, sizeBytes: file.size });
      await uploadFileToPresignedUrl(upload.uploadUrl, file, ({ percent }) => setProgress(percent));
      return updateProfileImage({ storageKey: upload.storageKey, mimeType: file.type });
    },
    onSuccess: (updated, action) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, updated);
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updated);
      void queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
      setSelected(null);
      setConfirmRemoval(false);
      setNotice({
        error: false,
        message:
          action === "remove" ? "프로필 이미지가 삭제되었어요." : "프로필 이미지가 저장되었어요.",
      });
    },
    onError: (error) => {
      setNotice({ error: true, message: getErrorMessage(error) });
      void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
    onSettled: () => onBusyChange(false),
  });

  const busy = disabled || mutation.isPending;
  const startMutation = (action: "upload" | "remove") => {
    setNotice(null);
    setProgress(0);
    onBusyChange(true);
    mutation.mutate(action);
  };

  const imageUrl = selected?.url ?? getProfileImageUrl(profile.profileImageKey);

  return (
    <section
      aria-label="프로필 이미지"
      aria-busy={mutation.isPending}
      className="space-y-3 rounded-xl border border-border bg-surface-muted/60 p-4"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            key={imageUrl ?? "fallback"}
            src={imageUrl}
            alt={selected ? "선택한 프로필 이미지 미리보기" : "프로필 이미지"}
            fallback={profile.name}
            className="h-20 w-20 text-2xl"
          />
          <div>
            <p className="text-sm font-semibold">프로필 이미지</p>
            <p id="profile-image-help" className="text-xs text-muted-foreground">
              JPG, PNG, WEBP · 최대 10MB
            </p>
            {selected && (
              <p className="max-w-48 truncate text-xs text-muted-foreground">
                {selected.file.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id="profile-image-file"
            type="file"
            accept={ACCEPTED_DIARY_PHOTO_TYPES.join(",")}
            aria-label="프로필 이미지 파일 선택"
            aria-describedby="profile-image-help"
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              if (!isDiaryPhotoMimeType(file.type)) {
                setNotice({
                  error: true,
                  message: "JPG, PNG, WEBP 형식의 이미지만 선택할 수 있어요.",
                });
                return;
              }
              if (file.size < 1 || file.size > MAX_DIARY_PHOTO_SIZE_BYTES) {
                setNotice({
                  error: true,
                  message: "이미지는 0바이트보다 크고 최대 10MB 이하여야 해요.",
                });
                return;
              }
              setSelected({ file, url: URL.createObjectURL(file) });
              setConfirmRemoval(false);
              setNotice(null);
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            이미지 변경
          </Button>
          {selected ? (
            <>
              <Button type="button" disabled={busy} onClick={() => startMutation("upload")}>
                {mutation.isPending ? "처리 중..." : "이미지 저장"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  setSelected(null);
                  setNotice(null);
                }}
              >
                선택 취소
              </Button>
            </>
          ) : (
            profile.profileImageKey && (
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => setConfirmRemoval(true)}
              >
                이미지 삭제
              </Button>
            )
          )}
        </div>
      </div>
      {confirmRemoval && (
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="프로필 이미지 삭제 확인"
        >
          <p className="text-sm">프로필 이미지를 삭제할까요?</p>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={() => startMutation("remove")}
          >
            삭제 확인
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => setConfirmRemoval(false)}
          >
            취소
          </Button>
        </div>
      )}
      {mutation.isPending && selected && (
        <div
          role="progressbar"
          aria-label="프로필 이미지 업로드 진행률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="h-2 overflow-hidden rounded-full bg-border"
        >
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {notice && (
        <p
          role={notice.error ? "alert" : "status"}
          className={notice.error ? "text-sm text-destructive" : "text-sm text-success"}
        >
          {notice.message}
        </p>
      )}
    </section>
  );
};

export default ProfileImageControl;
