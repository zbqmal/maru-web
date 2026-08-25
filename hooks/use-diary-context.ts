"use client";

import { useQuery } from "@tanstack/react-query";
import { getDiaryContext } from "@/lib/api/diary";

export const diaryContextQueryKey = (groupId: string, date: string) =>
  ["groups", groupId, "diary-context", date] as const;

export const useDiaryContextQuery = (groupId: string | null, date: string) =>
  useQuery({
    queryKey: diaryContextQueryKey(groupId ?? "", date),
    queryFn: () => getDiaryContext(groupId!, date),
    enabled: !!groupId,
  });
