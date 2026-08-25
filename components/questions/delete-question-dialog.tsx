"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";

type DeleteQuestionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: string;
  isPending: boolean;
  error: Error | null;
  onConfirm: () => void;
};

const DeleteQuestionDialog = ({
  open,
  onOpenChange,
  question,
  isPending,
  error,
  onConfirm,
}: DeleteQuestionDialogProps) => {
  const handleClose = () => {
    if (!isPending) onOpenChange(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} titleId="delete-question-title">
      <DialogHeader>
        <DialogTitle id="delete-question-title">질문 삭제</DialogTitle>
        <DialogClose onClose={handleClose} />
      </DialogHeader>
      <DialogBody>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-foreground">
            아래 질문을 삭제할까요? 삭제하면 되돌릴 수 없어요.
          </p>
          <p className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-foreground">
            &ldquo;{question}&rdquo;
          </p>
          {error?.message && (
            <p className="text-xs text-destructive" role="alert">
              {error.message}
            </p>
          )}
          <DialogFooter className="mt-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              취소
            </Button>
            <Button data-testid="confirm-button" variant="destructive" onClick={onConfirm} disabled={isPending}>
              {isPending ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </div>
      </DialogBody>
    </Dialog>
  );
};

export default DeleteQuestionDialog;
