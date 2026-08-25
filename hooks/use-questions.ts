"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  type CreateQuestionInput,
  type UpdateQuestionInput,
  type ReorderQuestionsInput,
} from "@/lib/api/questions";

export const questionsQueryKey = (groupId: string) => ["groups", groupId, "questions"] as const;

export const useQuestionsQuery = (groupId: string | null) =>
  useQuery({
    queryKey: questionsQueryKey(groupId ?? ""),
    queryFn: () => listQuestions(groupId!),
    enabled: !!groupId,
  });

export const useCreateQuestionMutation = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuestionInput) => createQuestion(groupId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionsQueryKey(groupId) }),
  });
};

export const useUpdateQuestionMutation = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, ...body }: { questionId: string } & UpdateQuestionInput) =>
      updateQuestion(groupId, questionId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionsQueryKey(groupId) }),
  });
};

export const useDeleteQuestionMutation = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => deleteQuestion(groupId, questionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionsQueryKey(groupId) }),
  });
};

export const useReorderQuestionsMutation = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReorderQuestionsInput) => reorderQuestions(groupId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionsQueryKey(groupId) }),
  });
};
