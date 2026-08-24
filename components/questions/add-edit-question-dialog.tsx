"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Mode = "add" | "edit";

type AddEditQuestionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  initialValue?: string;
  isPending: boolean;
  error: Error | null;
  onSubmit: (question: string) => void;
};

const MAX_LENGTH = 200;

const AddEditQuestionDialog = ({
  open,
  onOpenChange,
  mode,
  initialValue = "",
  isPending,
  error,
  onSubmit,
}: AddEditQuestionDialogProps) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  const handleClose = () => {
    if (!isPending) onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  const titleId = mode === "add" ? "add-question-title" : "edit-question-title";
  const title = mode === "add" ? "질문 추가하기" : "질문 수정하기";
  const submitLabel = mode === "add" ? "추가" : "저장";
  const pendingLabel = mode === "add" ? "추가 중..." : "저장 중...";

  return (
    <Dialog open={open} onClose={handleClose} titleId={titleId}>
      <DialogHeader>
        <DialogTitle id={titleId}>{title}</DialogTitle>
        <DialogClose onClose={handleClose} />
      </DialogHeader>
      <DialogBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="question-input" className="text-sm font-medium text-foreground">
              질문 내용
            </label>
            <Input
              id="question-input"
              placeholder="예) 오늘 가장 감사한 일은?"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={MAX_LENGTH}
              disabled={isPending}
              autoFocus
            />
            <p className="text-right text-xs text-muted-foreground">
              {value.length} / {MAX_LENGTH}
            </p>
            {error && (
              <p className="text-xs text-destructive" role="alert">
                {error.message}
              </p>
            )}
          </div>
          <DialogFooter className="mt-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              취소
            </Button>
            <Button type="submit" disabled={!value.trim() || isPending}>
              {isPending ? pendingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogBody>
    </Dialog>
  );
};

export default AddEditQuestionDialog;
