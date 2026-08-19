"use client";

import { useState } from "react";
import { LogOut, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import Avatar from "@/components/ui/avatar";
import { useLeaveGroupMutation, useTransferLeadershipMutation } from "@/hooks/use-groups";
import { getErrorMessage } from "@/lib/api/errors";
import type { Group, GroupMember } from "@/lib/api/groups";

type LeaveGroupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  currentUserId: string;
};

const LeaveGroupDialog = ({ open, onOpenChange, group, currentUserId }: LeaveGroupDialogProps) => {
  const [selectedSuccessorId, setSelectedSuccessorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const leaveMutation = useLeaveGroupMutation();
  const transferMutation = useTransferLeadershipMutation();

  const isPending = leaveMutation.isPending || transferMutation.isPending;

  const currentMember = group.memberships.find((m) => m.userId === currentUserId);
  const isLeader = currentMember?.role === "LEADER";
  const otherMembers: GroupMember[] = group.memberships.filter((m) => m.userId !== currentUserId);

  const handleClose = () => {
    if (!isPending) {
      setSelectedSuccessorId(null);
      setError(null);
      onOpenChange(false);
    }
  };

  const handleLeave = async () => {
    setError(null);

    try {
      // If leader and there are other members, must transfer leadership first
      if (isLeader && otherMembers.length > 0) {
        const successorUserId = selectedSuccessorId ?? otherMembers[0].userId;
        await transferMutation.mutateAsync({ groupId: group.id, newLeaderId: successorUserId });
      }

      await leaveMutation.mutateAsync(group.id);
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} titleId="leave-group-title">
      <DialogHeader>
        <DialogTitle id="leave-group-title">그룹 나가기</DialogTitle>
        <DialogClose onClose={handleClose} />
      </DialogHeader>

      <DialogBody>
        <div className="flex flex-col gap-4">
          {isLeader && otherMembers.length > 0 ? (
            <>
              <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3">
                <Crown className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                <p className="text-sm text-amber-800">
                  그룹을 나가기 전에 새로운 리더를 선택해 주세요. 선택한 멤버에게 리더 권한이
                  이전됩니다.
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground">새로운 리더 선택</p>
                <ul className="flex flex-col gap-1" role="listbox" aria-label="리더로 지정할 멤버">
                  {otherMembers.map((member) => {
                    const isSelected =
                      selectedSuccessorId === member.userId ||
                      (selectedSuccessorId === null && member === otherMembers[0]);
                    return (
                      <li key={member.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => setSelectedSuccessorId(member.userId)}
                          className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                            isSelected
                              ? "border-accent bg-primary-light font-medium text-foreground"
                              : "border-border bg-surface text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                          }`}
                        >
                          <Avatar fallback={member.user.name} size="sm" />
                          <span className="truncate">{member.user.name}</span>
                          {isSelected && (
                            <Crown
                              className="ml-auto h-3.5 w-3.5 shrink-0 text-amber-500"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
                리더를 이전한 후 <strong className="text-foreground">{group.name}</strong> 그룹에서
                나가게 됩니다.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              정말로 <strong className="text-foreground">{group.name}</strong> 그룹을 나가시겠어요?
              {isLeader && otherMembers.length === 0 && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  마지막 멤버이므로 그룹이 자동으로 정리될 수 있어요.
                </span>
              )}
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </DialogBody>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
          취소
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => void handleLeave()}
          disabled={isPending}
        >
          <LogOut className="h-4 w-4" />
          {isPending ? "처리 중..." : "그룹 나가기"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default LeaveGroupDialog;
