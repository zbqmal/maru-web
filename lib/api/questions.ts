import { apiRequest } from "@/lib/api/client";

export interface GroupQuestion {
  id: string;
  groupId: string;
  question: string;
  displayOrder: number;
  isActive: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionInput {
  question: string;
}

export interface UpdateQuestionInput {
  question?: string;
}

export interface ReorderQuestionsInput {
  questionIds: string[];
}

export const listQuestions = (groupId: string) =>
  apiRequest<GroupQuestion[]>(`/groups/${groupId}/questions`);

export const createQuestion = (groupId: string, body: CreateQuestionInput) =>
  apiRequest<GroupQuestion>(`/groups/${groupId}/questions`, { method: "POST", body });

export const updateQuestion = (groupId: string, questionId: string, body: UpdateQuestionInput) =>
  apiRequest<GroupQuestion>(`/groups/${groupId}/questions/${questionId}`, {
    method: "PATCH",
    body,
  });

export const deleteQuestion = (groupId: string, questionId: string) =>
  apiRequest<void>(`/groups/${groupId}/questions/${questionId}`, { method: "DELETE" });

export const reorderQuestions = (groupId: string, body: ReorderQuestionsInput) =>
  apiRequest<GroupQuestion[]>(`/groups/${groupId}/questions/reorder`, { method: "PATCH", body });
