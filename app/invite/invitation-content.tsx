"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, AlertCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useCurrentUserQuery } from "@/hooks/use-current-user";
import { useValidateInvitationQuery, useAcceptInvitationMutation } from "@/hooks/use-groups";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

const getInvitationErrorState = (
  error: unknown
): { icon: React.ReactNode; title: string; description: string } => {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return {
        icon: <XCircle className="h-12 w-12 text-destructive" aria-hidden="true" />,
        title: "초대 링크를 찾을 수 없어요",
        description: "유효하지 않은 초대 링크예요. 링크를 다시 확인해주세요.",
      };
    }
    if (error.status === 410) {
      return {
        icon: <Clock className="h-12 w-12 text-amber-500" aria-hidden="true" />,
        title: "초대 링크가 만료되었어요",
        description: "이 초대 링크는 기간이 지났어요. 그룹 리더에게 다시 초대를 요청해주세요.",
      };
    }
    if (error.status === 409) {
      return {
        icon: <AlertCircle className="h-12 w-12 text-amber-500" aria-hidden="true" />,
        title: "이미 사용된 초대 링크예요",
        description: "이 초대 링크는 이미 사용되었어요. 로그인 후 그룹을 확인해보세요.",
      };
    }
  }
  return {
    icon: <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />,
    title: "오류가 발생했어요",
    description: "잠시 후 다시 시도해 주세요.",
  };
};

const InvitationContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const { data: currentUser, isLoading: isUserLoading } = useCurrentUserQuery();
  const {
    data: invitation,
    isLoading: isInvitationLoading,
    error: invitationError,
  } = useValidateInvitationQuery(token);

  const { mutate: accept, isPending: isAccepting, error: acceptError } = useAcceptInvitationMutation();

  const isAuthenticated = !isUserLoading && !!currentUser;
  const isLoading = isUserLoading || isInvitationLoading;

  const inviteDestination = `/invite?token=${encodeURIComponent(token)}`;

  useEffect(() => {
    if (!isLoading && invitation && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(inviteDestination)}`);
    }
  }, [isLoading, invitation, isAuthenticated, router, inviteDestination]);

  const handleAccept = () => {
    if (!token || isAccepting) return;
    accept(token, {
      onSuccess: (group) => {
        router.push(`/home?group=${group.id}`);
      },
    });
  };

  if (!token) {
    return (
      <InvitationShell>
        <div className="flex flex-col items-center gap-4 text-center">
          <XCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
          <div>
            <p className="text-base font-semibold text-foreground">초대 링크가 올바르지 않아요</p>
            <p className="mt-1 text-sm text-muted-foreground">
              이메일에서 받은 초대 링크를 다시 확인해주세요.
            </p>
          </div>
        </div>
      </InvitationShell>
    );
  }

  if (isLoading || (invitation && !isAuthenticated)) {
    return (
      <InvitationShell>
        <LoadingSpinner label="초대 링크를 확인하는 중..." />
      </InvitationShell>
    );
  }

  if (invitationError) {
    const { icon, title, description } = getInvitationErrorState(invitationError);
    return (
      <InvitationShell>
        <div className="flex flex-col items-center gap-4 text-center">
          {icon}
          <div>
            <p className="text-base font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          {invitationError instanceof ApiError && invitationError.status === 409 && (
            <Button asChild variant="outline" className="mt-2">
              <Link href="/login">로그인하기</Link>
            </Button>
          )}
        </div>
      </InvitationShell>
    );
  }

  if (!invitation) return null;

  const expiresAt = new Date(invitation.expiresAt);
  const expiresAtLabel = expiresAt.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <InvitationShell>
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Users className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>

        <div>
          <p className="text-sm text-muted-foreground">그룹 초대</p>
          <h1 className="mt-1 text-xl font-bold text-foreground">{invitation.groupName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{invitation.invitedEmail}</span>
            으로 그룹 초대가 왔어요.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 rounded-lg bg-muted/40 px-4 py-3 text-left text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>그룹명</span>
            <span className="font-medium text-foreground">{invitation.groupName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>초대 만료일</span>
            <span className="font-medium text-foreground">{expiresAtLabel}</span>
          </div>
        </div>

        {acceptError && (
          <p role="alert" className="text-sm text-destructive">
            {getErrorMessage(acceptError)}
          </p>
        )}

        <Button
          size="lg"
          className="w-full"
          onClick={handleAccept}
          disabled={isAccepting}
        >
          {isAccepting ? "참가 중..." : "그룹 참가하기"}
        </Button>
      </div>
    </InvitationShell>
  );
};

export default InvitationContent;

const InvitationShell = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
    <div className="mb-8 text-center">
      <p className="text-2xl font-bold text-foreground">MARU</p>
      <p className="mt-1 text-sm text-muted-foreground">우리의 하루를, 함께</p>
    </div>
    <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm">
      {children}
    </div>
    <footer className="mt-8 text-xs text-muted-foreground">© 2026 MARU. All rights reserved.</footer>
  </div>
);
