"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteGroupMutation } from "@/hooks/use-groups";
import { getErrorMessage } from "@/lib/api/errors";
import type { Group } from "@/lib/api/groups";

type DeleteGroupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  currentUserId: string;
};

const DeleteGroupDialog = ({ open, onOpenChange, group, currentUserId }: DeleteGroupDialogProps) => {
  const [confirmationText, setConfirmationText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const deleteMutation = useDeleteGroupMutation();

  const currentMember = group.memberships.find((member) => member.userId === currentUserId);
  const isLeader = currentMember?.role === "LEADER";
  const isConfirmMatched = confirmationText === group.name;
  const isPending = deleteMutation.isPending;

  const handleClose = () => {
    if (isPending) return;
    setConfirmationText("");
    setError(null);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!isConfirmMatched || !isLeader) return;
    setError(null);

    try {
      await deleteMutation.mutateAsync(group.id);
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} titleId="delete-group-title">
      <DialogHeader>
        <DialogTitle id="delete-group-title">그룹 삭제</DialogTitle>
        <DialogClose onClose={handleClose} />
      </DialogHeader>

      <DialogBody>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                이 작업은 되돌릴 수 없으며 그룹 데이터가 모두 삭제됩니다.
              </p>
              <p className="text-xs text-muted-foreground">
                그룹, 멤버십, 초대, 질문, 기록 데이터가 함께 삭제됩니다.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              삭제를 진행하려면 아래에 그룹 이름을 정확히 입력해 주세요:
            </p>
            <p className="rounded-md bg-surface-muted px-3 py-2 text-sm font-semibold text-foreground">
              {group.name}
            </p>
            <label htmlFor="group-delete-confirmation" className="text-sm font-medium text-foreground">
              그룹 이름 확인
            </label>
            <Input
              id="group-delete-confirmation"
              value={confirmationText}
              onChange={(event) => setConfirmationText(event.target.value)}
              placeholder={group.name}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

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
          onClick={() => void handleDelete()}
          disabled={isPending || !isConfirmMatched || !isLeader}
        >
          <Trash2 className="h-4 w-4" />
          {isPending ? "삭제 중..." : "그룹 삭제"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default DeleteGroupDialog;
