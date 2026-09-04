"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/tailwind.utils";
import type { AnswerQuestionType, DiaryAnswer } from "@/lib/api/diary";
import PhotoPicker from "@/components/diary/photo-picker";
import { PhotoUploadState, SelectedPhoto } from "@/lib/types/media.types";

export interface DiaryQuestionCardQuestion {
  id: string;
  question: string;
  questionType: AnswerQuestionType;
}

export interface DiaryQuestionCardProps {
  question: DiaryQuestionCardQuestion;
  index: number;
  existingAnswer: DiaryAnswer | undefined;
  onSubmit: (
    question: DiaryQuestionCardQuestion,
    body: string,
    photos: SelectedPhoto[],
    onPhotoUploadStateChange: (photoId: string, state: PhotoUploadState) => void
  ) => Promise<void>;
}

const DiaryQuestionCard = ({
  question,
  index,
  existingAnswer,
  onSubmit,
}: DiaryQuestionCardProps) => {
  const isDailyQuestion = question.questionType === "DAILY";
  const isCompleted = !!existingAnswer;
  const [isExpanded, setIsExpanded] = useState(false);
  const [body, setBody] = useState(existingAnswer?.body ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [photoUploadStates, setPhotoUploadStates] = useState<Record<string, PhotoUploadState>>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const questionLabel = isDailyQuestion ? "오늘의 질문" : `질문 ${index + 1}`;

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  // Keep a live reference to the selected photos so the unmount cleanup below
  // can revoke whatever preview URLs are current, without re-running on every change.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  // Revoke any remaining local preview object URLs when the card unmounts.
  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
  }, []);

  const resetPhotos = () => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    setPhotos([]);
    setPhotoUploadStates({});
    setPhotoError(null);
  };

  const handleToggle = () => {
    if (isExpanded) {
      // Reset draft to saved answer when collapsing
      setBody(existingAnswer?.body ?? "");
      resetPhotos();
    }
    setIsExpanded((prev) => !prev);
  };

  const handleAddPhotos = (added: SelectedPhoto[]) => {
    setPhotos((prev) => [...prev, ...added]);
    setPhotoUploadStates((prev) => {
      const next = { ...prev };
      added.forEach((photo) => {
        next[photo.id] = { status: "idle", progress: 0 };
      });
      return next;
    });
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((photo) => photo.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((photo) => photo.id !== id);
    });
    setPhotoUploadStates((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handlePhotoUploadStateChange = (photoId: string, state: PhotoUploadState) => {
    setPhotoUploadStates((prev) => ({ ...prev, [photoId]: state }));
  };

  const handleSubmit = async () => {
    const trimmed = body.trim();

    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    setPhotoError(null);

    try {
      const photosToUpload = photos.filter(
        (photo) => photoUploadStates[photo.id]?.status !== "uploaded"
      );

      await onSubmit(question, trimmed, photosToUpload, handlePhotoUploadStateChange);
      setIsExpanded(false);
      resetPhotos();
    } catch {
      setPhotoError("답변 저장 또는 사진 업로드에 실패했어요. 다시 시도해주세요.");
      // keep the card expanded so the user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <li
      className={cn(
        "rounded-xl border transition-colors",
        isExpanded
          ? isDailyQuestion
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-primary bg-surface shadow-sm"
          : isDailyQuestion
            ? "border-primary/40 bg-primary/5 hover:border-primary/80"
            : "border-border bg-surface hover:border-primary/50"
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls={`diary-answer-${question.id}`}
      >
        <span
          className={cn(
            "shrink-0 text-xs font-semibold",
            isDailyQuestion ? "text-primary" : "text-muted-foreground"
          )}
        >
          {questionLabel}
        </span>
        <p className="flex-1 text-sm font-medium text-foreground">{question.question}</p>
        {isCompleted && !isExpanded && (
          <CheckCircle2
            role="img"
            aria-label="작성 완료"
            className="h-4 w-4 shrink-0 text-success"
          />
        )}
      </button>

      {isExpanded && (
        <div id={`diary-answer-${question.id}`} className="flex flex-col gap-3 px-4 pb-4">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className={cn(
              "w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-label={`${questionLabel} 답변 입력`}
          />
          <PhotoPicker
            photos={photos}
            onAdd={handleAddPhotos}
            onRemove={handleRemovePhoto}
            disabled={isSubmitting}
            error={photoError}
            onError={setPhotoError}
            uploadStates={photoUploadStates}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={!body.trim() || isSubmitting}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting
                ? "저장 중..."
                : Object.values(photoUploadStates).some((state) => state.status === "failed")
                  ? "다시 시도"
                  : isCompleted
                    ? "수정하기"
                    : "답변하기"}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
};

export default DiaryQuestionCard;
