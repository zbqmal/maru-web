"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import ErrorState from "@/components/ui/error-state";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useCurrentUserQuery } from "@/hooks/use-current-user";

const AuthenticatedAppShell = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: currentUser, isLoading, isError, refetch } = useCurrentUserQuery();

  useEffect(() => {
    if (!isLoading && !isError && !currentUser) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [currentUser, isError, isLoading, pathname, router]);

  if (isLoading || (!isError && !currentUser)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <LoadingSpinner label="세션을 확인하는 중..." className="py-0" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <ErrorState
          title="세션을 확인할 수 없어요"
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  return <AppShell currentUser={currentUser}>{children}</AppShell>;
};

export default AuthenticatedAppShell;
