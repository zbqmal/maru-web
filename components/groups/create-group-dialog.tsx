"use client";

import { useState } from "react";
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
import { useCreateGroupMutation } from "@/hooks/use-groups";

type CreateGroupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const CreateGroupDialog = ({ open, onOpenChange }: CreateGroupDialogProps) => {
  const [name, setName] = useState("");
  const { mutate: create, isPending, error } = useCreateGroupMutation();

  const handleClose = () => {
    if (!isPending) {
      setName("");
      onOpenChange(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    create(
      { name: trimmed },
      {
        onSuccess: () => {
          setName("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} titleId="create-group-title">
      <DialogHeader>
        <DialogTitle id="create-group-title">그룹 만들기</DialogTitle>
        <DialogClose onClose={handleClose} />
      </DialogHeader>
      <DialogBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="group-name" className="text-sm font-medium text-foreground">
              그룹 이름
            </label>
            <Input
              id="group-name"
              placeholder="예) 우리 가족, 친구들"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              disabled={isPending}
              autoFocus
            />
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
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? "생성 중..." : "만들기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogBody>
    </Dialog>
  );
};

export default CreateGroupDialog;
