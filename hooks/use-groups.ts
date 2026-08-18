"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createGroup, listGroups, type CreateGroupInput } from "@/lib/api/groups";
import { useActiveGroupStore } from "@/lib/store/active-group";

export const GROUPS_QUERY_KEY = ["groups"] as const;

export const useGroupsQuery = () =>
  useQuery({
    queryKey: GROUPS_QUERY_KEY,
    queryFn: listGroups,
  });

export const useCreateGroupMutation = () => {
  const queryClient = useQueryClient();
  const setActiveGroupId = useActiveGroupStore((s) => s.setActiveGroupId);

  return useMutation({
    mutationFn: (input: CreateGroupInput) => createGroup(input),
    onSuccess: async (group) => {
      await queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
      setActiveGroupId(group.id);
    },
  });
};
