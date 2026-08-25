import { apiRequest } from "@/lib/api/client";
import type { GroupQuestion } from "@/lib/api/questions";

export type AnswerQuestionType = "CUSTOM" | "DAILY";

export interface DiaryAnswer {
  id: string;
  diaryEntryId: string;
  questionType: AnswerQuestionType;
  groupQuestionId: string | null;
  body: string;
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

export const getDiaryContext = (groupId: string, date: string) =>
  apiRequest<DiaryContextResponse>(
    `/groups/${groupId}/diary/context?date=${encodeURIComponent(date)}`
  );
