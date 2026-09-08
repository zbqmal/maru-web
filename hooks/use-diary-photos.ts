"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  registerDiaryPhoto,
  deleteDiaryPhoto,
  type DiaryContextResponse,
  type RegisterDiaryPhotoInput,
} from "@/lib/api/diary";
import { diaryContextQueryKey } from "@/hooks/use-diary-context";
import { groupDailyFeedQueryKey } from "@/hooks/use-group-daily-feed";

interface RegisterDiaryPhotoVariables {
  diaryEntryId: string;
  input: RegisterDiaryPhotoInput;
}

export const useRegisterDiaryPhotoMutation = (groupId: string, date: string) => {
  const queryClient = useQueryClient();
  const diaryContextKey = diaryContextQueryKey(groupId, date);
  const dailyFeedKey = groupDailyFeedQueryKey(groupId, date);

  return useMutation({
    mutationFn: ({ diaryEntryId, input }: RegisterDiaryPhotoVariables) =>
      registerDiaryPhoto(groupId, diaryEntryId, input),
    onSuccess: async (newPhoto) => {
      queryClient.setQueryData<DiaryContextResponse>(diaryContextKey, (prev) => {
        if (!prev?.entry) return prev;

        return {
          ...prev,
          entry: {
            ...prev.entry,
            photos: [...(prev.entry.photos ?? []), newPhoto],
          },
        };
      });
      await queryClient.invalidateQueries({ queryKey: dailyFeedKey });
    },
  });
};

interface DeleteDiaryPhotoVariables {
  diaryEntryId: string;
  photoId: string;
}

export const useDeleteDiaryPhotoMutation = (groupId: string, date: string) => {
  const queryClient = useQueryClient();
  const diaryContextKey = diaryContextQueryKey(groupId, date);
  const dailyFeedKey = groupDailyFeedQueryKey(groupId, date);

  return useMutation({
    mutationFn: ({ diaryEntryId, photoId }: DeleteDiaryPhotoVariables) =>
      deleteDiaryPhoto(groupId, diaryEntryId, photoId),
    onSuccess: async (_data, variables) => {
      queryClient.setQueryData<DiaryContextResponse>(diaryContextKey, (prev) => {
        if (!prev?.entry) return prev;

        return {
          ...prev,
          entry: {
            ...prev.entry,
            photos: (prev.entry.photos ?? []).filter((photo) => photo.id !== variables.photoId),
          },
        };
      });
      await queryClient.invalidateQueries({ queryKey: dailyFeedKey });
    },
  });
};
