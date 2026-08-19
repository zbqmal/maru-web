"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createGroup,
  leaveGroup,
  listGroups,
  transferLeadership,
  type CreateGroupInput,
  type TransferLeadershipInput,
} from "@/lib/api/groups";
import { useActiveGroupStore } from "@/lib/store/active-group";
import { useCurrentUserQuery } from "@/hooks/use-current-user";

export const GROUPS_QUERY_KEY = ["groups"] as const;

export const useGroupsQuery = () => {
  const { data: currentUser, isLoading: isCurrentUserLoading } = useCurrentUserQuery();

  return useQuery({
    queryKey: GROUPS_QUERY_KEY,
    queryFn: listGroups,
    enabled: !isCurrentUserLoading && !!currentUser,
  });
};

export const useActiveGroupQuery = () => {
  const { data: groups, isLoading, isError, refetch } = useGroupsQuery();
  const activeGroupId = useActiveGroupStore((s) => s.activeGroupId);

  const activeGroup = groups?.find((g) => g.id === activeGroupId) ?? null;

  return { groups, activeGroupId, activeGroup, isLoading, isError, refetch };
};

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

export const useLeaveGroupMutation = () => {
  const queryClient = useQueryClient();
  const { activeGroupId } = useActiveGroupQuery();
  const setActiveGroupId = useActiveGroupStore((s) => s.setActiveGroupId);

  return useMutation({
    mutationFn: (groupId: string) => leaveGroup(groupId),
    onSuccess: async (_data, groupId) => {
      await queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
      // Clear active group if user just left it
      if (activeGroupId === groupId) {
        setActiveGroupId(null);
      }
    },
  });
};

export const useTransferLeadershipMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, ...body }: { groupId: string } & TransferLeadershipInput) =>
      transferLeadership(groupId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
    },
  });
};
