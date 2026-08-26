"use client";

import { useQuery } from "@tanstack/react-query";
import { getGroupDailyFeed } from "@/lib/api/diary";

export const groupDailyFeedQueryKey = (groupId: string, date: string) =>
  ["groups", groupId, "diary-feed", date] as const;

export const useGroupDailyFeedQuery = (groupId: string | null, date: string) =>
  useQuery({
    queryKey: groupDailyFeedQueryKey(groupId ?? "", date),
    queryFn: () => getGroupDailyFeed(groupId!, date),
    enabled: !!groupId,
  });
