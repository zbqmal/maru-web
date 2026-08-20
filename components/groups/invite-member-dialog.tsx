"use client";

import { useState } from "react";
import { Mail, CheckCircle } from "lucide-react";
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
import { useInviteMemberMutation } from "@/hooks/use-invitations";
import { getErrorMessage } from "@/lib/api/errors";

type InviteMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const InviteMemberDialog = ({ open, onOpenChange, groupId }: InviteMemberDialogProps) => {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutate: invite, isPending } = useInviteMemberMutation(groupId);

  const isValidEmail = EMAIL_REGEX.test(email.trim());

  const handleClose = () => {
    if (!isPending) {
      setEmail("");
      setSuccess(false);
      setErrorMessage(null);
      onOpenChange(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail || isPending) return;

    setErrorMessage(null);

    invite(
      { email: email.trim() },
      {
        onSuccess: () => {
          setSuccess(true);
        },
        onError: (err) => {
          setErrorMessage(getErrorMessage(err));
        },
      }
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} titleId="invite-member-title">
      <DialogHeader>
        <DialogTitle id="invite-member-title">멤버 초대</DialogTitle>
        <DialogClose onClose={handleClose} />
      </DialogHeader>

      <DialogBody>
        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle className="h-10 w-10 text-green-500" aria-hidden="true" />
            <div>
              <p className="font-medium text-foreground">초대 이메일을 보냈어요!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                <strong>{email.trim()}</strong>으로 초대 링크가 발송되었어요.
              </p>
            </div>
            <Button variant="outline" className="mt-2 w-full" onClick={handleClose}>
              확인
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="invite-email" className="text-sm font-medium text-foreground">
                이메일 주소
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="초대할 사람의 이메일"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="pl-9"
                  disabled={isPending}
                  autoFocus
                  autoComplete="email"
                />
              </div>
              {errorMessage && (
                <p className="text-xs text-destructive" role="alert">
                  {errorMessage}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              초대받은 사람이 이메일 링크를 통해 그룹에 참여할 수 있어요.
            </p>
            <DialogFooter className="mt-0">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                취소
              </Button>
              <Button type="submit" disabled={!isValidEmail || isPending}>
                {isPending ? "전송 중..." : "초대 보내기"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogBody>
    </Dialog>
  );
};

export default InviteMemberDialog;
