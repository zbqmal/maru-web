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

export interface DiaryContextResponse {
  questions: GroupQuestion[];
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
