import { apiRequest } from "@/lib/api/client";

export interface GroupMemberUser {
  id: string;
  name: string;
  profileImageKey: Record<string, unknown> | null;
}

export type GroupMemberRole = "LEADER" | "MEMBER";

export interface GroupMember {
  id: string;
  userId: string;
  role: GroupMemberRole;
  createdAt: string;
  updatedAt: string;
  user: GroupMemberUser;
}

export interface Group {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  memberships: GroupMember[];
}

export interface CreateGroupInput {
  name: string;
}

export interface TransferLeadershipInput {
  newLeaderId: string;
}

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

export const listGroups = () => apiRequest<Group[]>("/groups");

export const createGroup = (body: CreateGroupInput) =>
  apiRequest<Group>("/groups", { method: "POST", body });

export const getGroup = (groupId: string) => apiRequest<Group>(`/groups/${groupId}`);

export const listGroupMembers = (groupId: string) =>
  apiRequest<GroupMember[]>(`/groups/${groupId}/members`);

export const leaveGroup = (groupId: string) =>
  apiRequest<void>(`/groups/${groupId}/leave`, { method: "DELETE" });

export const deleteGroup = (groupId: string) =>
  apiRequest<void>(`/groups/${groupId}`, { method: "DELETE" });

export const transferLeadership = (groupId: string, body: TransferLeadershipInput) =>
  apiRequest<Group>(`/groups/${groupId}/transfer-leadership`, { method: "POST", body });

export const createInvitation = (groupId: string, body: CreateInvitationInput) =>
  apiRequest<Invitation>(`/groups/${groupId}/invitations`, { method: "POST", body });
