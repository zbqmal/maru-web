"use client";

import { useMutation } from "@tanstack/react-query";
import { createInvitation, type CreateInvitationInput } from "@/lib/api/invitations";

export const useInviteMemberMutation = (groupId: string) =>
  useMutation({
    mutationFn: (input: CreateInvitationInput) => createInvitation(groupId, input),
  });
