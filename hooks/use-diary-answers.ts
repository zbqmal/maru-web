"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createAnswer,
  updateAnswer,
  type CreateAnswerInput,
  type DiaryAnswer,
  type DiaryContextResponse,
} from "@/lib/api/diary";
import { diaryContextQueryKey } from "@/hooks/use-diary-context";
import { groupDailyFeedQueryKey } from "./use-group-daily-feed";

export const useCreateAnswerMutation = (groupId: string, date: string) => {
  const queryClient = useQueryClient();
  const diaryContextKey = diaryContextQueryKey(groupId, date);
  const dailyFeedKey = groupDailyFeedQueryKey(groupId, date);

  return useMutation({
    mutationFn: (input: CreateAnswerInput) => createAnswer(groupId, input),
    onSuccess: async (newAnswer) => {
      await queryClient.invalidateQueries({ queryKey: dailyFeedKey });
      queryClient.setQueryData<DiaryContextResponse>(diaryContextKey, (prev) => {
        if (!prev) return prev;

        const prevEntry = prev.entry;

        if (!prevEntry) {
          // The server created a new diary entry; add the answer to a minimal entry stub.
          // The next context refetch will hydrate the full entry.
          return {
            ...prev,
            entry: {
              id: newAnswer.diaryEntryId,
              diaryDate: date,
              answers: [newAnswer],
              createdAt: newAnswer.createdAt,
              updatedAt: newAnswer.updatedAt,
            },
          };
        }

        return {
          ...prev,
          entry: {
            ...prevEntry,
            answers: [...prevEntry.answers, newAnswer],
          },
        };
      });
    },
  });
};

interface UpdateAnswerMutationVariables {
  answerId: string;
  body: string;
}

export const useUpdateAnswerMutation = (groupId: string, date: string) => {
  const queryClient = useQueryClient();
  const diaryContextKey = diaryContextQueryKey(groupId, date);
  const dailyFeedKey = groupDailyFeedQueryKey(groupId, date);

  return useMutation({
    mutationFn: ({ answerId, body }: UpdateAnswerMutationVariables) =>
      updateAnswer(groupId, answerId, { body }),

    onMutate: async ({ answerId, body }) => {
      // Cancel outbound refetches so they don't overwrite the optimistic update.
      await queryClient.cancelQueries({ queryKey: diaryContextKey });

      const previousData = queryClient.getQueryData<DiaryContextResponse>(diaryContextKey);

      queryClient.setQueryData<DiaryContextResponse>(diaryContextKey, (prev) => {
        if (!prev?.entry) return prev;

        return {
          ...prev,
          entry: {
            ...prev.entry,
            answers: prev.entry.answers.map((a): DiaryAnswer =>
              a.id === answerId ? { ...a, body } : a
            ),
          },
        };
      });

      return { previousData };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(diaryContextKey, context.previousData);
      }
    },

    onSuccess: async (updatedAnswer) => {
      await queryClient.invalidateQueries({ queryKey: dailyFeedKey });
      queryClient.setQueryData<DiaryContextResponse>(diaryContextKey, (prev) => {
        if (!prev?.entry) return prev;

        return {
          ...prev,
          entry: {
            ...prev.entry,
            answers: prev.entry.answers.map((a): DiaryAnswer =>
              a.id === updatedAnswer.id ? updatedAnswer : a
            ),
          },
        };
      });
    },
  });
};
