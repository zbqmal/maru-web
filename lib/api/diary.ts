import { apiRequest } from "@/lib/api/client";
import type { GroupQuestion } from "@/lib/api/questions";

export type AnswerQuestionType = "CUSTOM" | "DAILY";

export interface DiaryAnswer {
  id: string;
  diaryEntryId: string;
  questionType: AnswerQuestionType;
  groupQuestionId: string | null;
  body: string;
  questionSnapshot: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryEntryContext {
  id: string;
  diaryDate: string;
  answers: DiaryAnswer[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyQuestion {
  id: string;
  question: string;
  questionDate: string;
  createdAt: string;
}

export interface DiaryContextResponse {
  questions: GroupQuestion[];
  dailyQuestion?: DailyQuestion | null;
  entry: DiaryEntryContext | null;
}

export interface CreateAnswerInput {
  date: string;
  questionType: AnswerQuestionType;
  groupQuestionId?: string;
  body: string;
}

export interface UpdateAnswerInput {
  body: string;
}

export type DiaryPhotoMimeType = "image/jpeg" | "image/png" | "image/webp";

export interface RequestDiaryPhotoUploadInput {
  mimeType: DiaryPhotoMimeType;
  sizeBytes: number;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  storageKey: string;
}

export interface FeedMemberUser {
  id: string;
  name: string;
  profileImageKey: Record<string, unknown> | null;
}

export interface FeedEntry {
  id: string;
  diaryDate: string;
  answers: DiaryAnswer[];
  createdAt: string;
  updatedAt: string;
}

export interface FeedMemberEntry {
  userId: string;
  user: FeedMemberUser;
  entry: FeedEntry | null;
}

export interface GroupDailyFeedResponse {
  date: string;
  members: FeedMemberEntry[];
}

export const getDiaryContext = (groupId: string, date: string) =>
  apiRequest<DiaryContextResponse>(
    `/groups/${groupId}/diary/context?date=${encodeURIComponent(date)}`
  );

export const createAnswer = (groupId: string, input: CreateAnswerInput) =>
  apiRequest<DiaryAnswer>(`/groups/${groupId}/diary/answers`, {
    method: "POST",
    body: input,
  });

export const updateAnswer = (groupId: string, answerId: string, input: UpdateAnswerInput) =>
  apiRequest<DiaryAnswer>(`/groups/${groupId}/diary/answers/${answerId}`, {
    method: "PATCH",
    body: input,
  });

export const getGroupDailyFeed = (groupId: string, date: string) =>
  apiRequest<GroupDailyFeedResponse>(
    `/groups/${groupId}/diary/feed?date=${encodeURIComponent(date)}`
  );

export const requestDiaryPhotoUpload = (
  groupId: string,
  diaryEntryId: string,
  input: RequestDiaryPhotoUploadInput
) =>
  apiRequest<PresignedUploadResponse>(
    `/groups/${groupId}/diary/entries/${diaryEntryId}/photos/upload-url`,
    {
      method: "POST",
      body: input,
    }
  );
