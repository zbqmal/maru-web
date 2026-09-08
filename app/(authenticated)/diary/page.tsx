"use client";

import EmptyState from "@/components/ui/empty-state";
import ErrorState from "@/components/ui/error-state";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DiaryQuestionCard, {
  type DiaryQuestionCardQuestion,
} from "@/components/diary/diary-question-card";
import GroupDailyFeed from "@/components/diary/group-daily-feed";
import { useDiaryContextQuery } from "@/hooks/use-diary-context";
import { useActiveGroupQuery } from "@/hooks/use-groups";
import { useCreateAnswerMutation, useUpdateAnswerMutation } from "@/hooks/use-diary-answers";
import { useRegisterDiaryPhotoMutation } from "@/hooks/use-diary-photos";
import { requestDiaryPhotoUpload } from "@/lib/api/diary";
import type { DiaryAnswer } from "@/lib/api/diary";
import { uploadFileToPresignedUrl } from "@/lib/api/uploads";
import { getImageDimensions, isDiaryPhotoMimeType } from "@/lib/utils/media.utils";
import { getLocalDateString } from "@/lib/utils/date.utils";
import { PhotoUploadState, SelectedPhoto } from "@/lib/types/media.types";

const StreakPlaceholderCard = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-sm">
        <span aria-hidden="true">🔥</span>
        연속 기록 현황
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-sm">그룹에 참여하면 연속 기록을 확인할 수 있어요.</p>
    </CardContent>
  </Card>
);

const CalendarPlaceholderCard = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-sm">
        <span aria-hidden="true">📅</span>
        이번 달 기록
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-sm">
        그룹에 참여하면 달력에서 기록을 확인할 수 있어요.
      </p>
    </CardContent>
  </Card>
);

const DiaryPage = () => {
  const { activeGroup } = useActiveGroupQuery();
  const date = getLocalDateString();
  const { data, isLoading, isError, refetch } = useDiaryContextQuery(activeGroup?.id ?? null, date);

  const groupId = activeGroup?.id ?? "";
  const createAnswerMutation = useCreateAnswerMutation(groupId, date);
  const updateAnswerMutation = useUpdateAnswerMutation(groupId, date);
  const registerPhotoMutation = useRegisterDiaryPhotoMutation(groupId, date);

  const answers = data?.entry?.answers ?? [];
  const customQuestions = data?.questions ?? [];
  const dailyQuestion = data?.dailyQuestion;
  const questions: DiaryQuestionCardQuestion[] = [
    ...customQuestions.map((question) => ({
      id: question.id,
      question: question.question,
      questionType: "CUSTOM" as const,
    })),
    ...(dailyQuestion
      ? [{ id: dailyQuestion.id, question: dailyQuestion.question, questionType: "DAILY" as const }]
      : []),
  ];

  const getExistingAnswer = (question: DiaryQuestionCardQuestion): DiaryAnswer | undefined =>
    question.questionType === "DAILY"
      ? answers.find((a) => a.questionType === "DAILY")
      : answers.find((a) => a.questionType === "CUSTOM" && a.groupQuestionId === question.id);

  const handleSubmit = async (
    question: DiaryQuestionCardQuestion,
    body: string,
    photos: SelectedPhoto[],
    onPhotoUploadStateChange: (photoId: string, state: PhotoUploadState) => void
  ): Promise<void> => {
    if (!activeGroup) return;

    const existingAnswer = getExistingAnswer(question);
    const savedAnswer = existingAnswer
      ? await updateAnswerMutation.mutateAsync({ answerId: existingAnswer.id, body })
      : await createAnswerMutation.mutateAsync({
          date,
          questionType: question.questionType,
          ...(question.questionType === "CUSTOM" ? { groupQuestionId: question.id } : {}),
          body,
        });

    for (const photo of photos) {
      if (!isDiaryPhotoMimeType(photo.file.type)) {
        onPhotoUploadStateChange(photo.id, {
          status: "failed",
          progress: 0,
          error: "지원하지 않는 사진 형식입니다.",
        });
        throw new Error("Unsupported photo MIME type.");
      }

      try {
        onPhotoUploadStateChange(photo.id, { status: "requesting", progress: 0 });
        const upload = await requestDiaryPhotoUpload(activeGroup.id, savedAnswer.diaryEntryId, {
          mimeType: photo.file.type,
          sizeBytes: photo.file.size,
        });

        onPhotoUploadStateChange(photo.id, { status: "uploading", progress: 0 });
        await uploadFileToPresignedUrl(upload.uploadUrl, photo.file, (progress) => {
          onPhotoUploadStateChange(photo.id, {
            status: "uploading",
            progress: progress.percent,
          });
        });

        const { width, height } = await getImageDimensions(photo.file);
        await registerPhotoMutation.mutateAsync({
          diaryEntryId: savedAnswer.diaryEntryId,
          input: {
            storageKey: upload.storageKey,
            mimeType: photo.file.type,
            width,
            height,
            sizeBytes: photo.file.size,
          },
        });

        onPhotoUploadStateChange(photo.id, {
          status: "uploaded",
          progress: 100,
          storageKey: upload.storageKey,
        });
      } catch (error) {
        onPhotoUploadStateChange(photo.id, {
          status: "failed",
          progress: 0,
          error: error instanceof Error ? error.message : "사진 업로드에 실패했어요.",
        });
        throw error;
      }
    }
  };

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1">
        <div className="mb-6">
          <h1 className="mb-1 text-xl font-bold">오늘의 다이어리</h1>
          <p className="text-sm text-muted-foreground">오늘도 기록해볼까요? ☀️</p>
        </div>

        {!activeGroup ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon="📖"
                title="그룹을 먼저 선택해주세요"
                description="그룹을 선택하면 오늘의 질문을 확인할 수 있어요."
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-4">
                  <span>{activeGroup.name}</span>
                  <span className="text-sm font-medium text-muted-foreground">{date}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  멤버 {activeGroup.memberships.length}명과 함께 오늘의 질문에 답해보세요.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">오늘의 질문</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingSpinner label="오늘의 다이어리를 불러오는 중..." />
                ) : isError ? (
                  <ErrorState
                    description="오늘의 질문을 불러오지 못했어요."
                    onRetry={() => void refetch()}
                  />
                ) : questions.length === 0 ? (
                  <EmptyState
                    icon="💬"
                    title="아직 활성화된 질문이 없어요"
                    description="그룹 리더가 질문을 추가하면 여기에 보여요."
                    className="py-10"
                  />
                ) : (
                  <ul aria-label="오늘의 질문 목록" className="flex flex-col gap-2">
                    {questions.map((question, index) => (
                      <DiaryQuestionCard
                        key={question.id}
                        question={question}
                        index={index}
                        existingAnswer={getExistingAnswer(question)}
                        onSubmit={handleSubmit}
                      />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <GroupDailyFeed
              groupId={activeGroup.id}
              date={date}
              totalQuestions={questions.length}
            />
          </>
        )}
      </div>

      {/* Right sidebar */}
      <aside aria-label="요약 정보" className="hidden w-64 shrink-0 flex-col gap-4 lg:flex">
        <StreakPlaceholderCard />
        <CalendarPlaceholderCard />
      </aside>
    </div>
  );
};

export default DiaryPage;
