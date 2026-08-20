import { apiRequest } from "@/lib/api/client";

export interface CreateInvitationInput {
  email: string;
}

export interface Invitation {
  id: string;
  groupId: string;
  invitedEmail: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export const createInvitation = (groupId: string, body: CreateInvitationInput) =>
  apiRequest<Invitation>(`/groups/${groupId}/invitations`, { method: "POST", body });
