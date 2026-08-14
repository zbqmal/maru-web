"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";
import Avatar from "@/components/ui/avatar";
import type { AuthUser } from "@/lib/api/auth";
import { logout } from "@/lib/api/auth";
import { CURRENT_USER_QUERY_KEY } from "@/lib/auth/session";
import { getErrorMessage } from "@/lib/api/errors";
import UserMenuItem from "./user-menu-item";

const MOCK_GROUP = { name: "우리 넷", memberCount: 4, avatarUrl: null };

type TopNavProps = {
  currentUser: AuthUser;
};

const TopNav = ({ currentUser }: TopNavProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      setUserMenuOpen(false);
      setLogoutError(null);
      queryClient.removeQueries({ queryKey: CURRENT_USER_QUERY_KEY });
      router.replace("/login");
      router.refresh();
    },
    onError: (error) => {
      setLogoutError(getErrorMessage(error));
    },
  });

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-surface px-6">
      {/* Group switcher */}
      <div className="flex flex-1 items-center gap-3">
        <Avatar fallback={MOCK_GROUP.name} size="default" className="bg-amber-200" />
        <div>
          <p className="text-xs text-muted-foreground">선택된 그룹</p>
          <button className="flex items-center gap-1 text-sm font-semibold text-foreground hover:opacity-80">
            {MOCK_GROUP.name}
            <ChevronDown className="h-3.5 w-3.5 text-muted" />
          </button>
        </div>
        <span className="ml-4 flex items-center gap-1 text-xs text-muted-foreground">
          <span>👥</span>
          멤버 {MOCK_GROUP.memberCount}명
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          aria-label="알림"
          className="rounded-full p-2 text-muted-foreground hover:bg-surface-muted"
        >
          <Bell className="h-5 w-5" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            aria-label="사용자 메뉴"
            aria-expanded={userMenuOpen}
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full px-2 py-1 hover:bg-surface-muted"
          >
            <Avatar fallback={currentUser.name} size="sm" />
            <span className="text-sm font-medium text-foreground">{currentUser.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted" />
          </button>

          {userMenuOpen && (
            <>
              {/* Backdrop to close */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-surface py-1 shadow-lg">
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {currentUser.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{currentUser.email}</p>
                </div>
                <UserMenuItem
                  href="/profile"
                  icon={User}
                  label="프로필"
                  onClick={() => setUserMenuOpen(false)}
                />
                <UserMenuItem
                  href="/settings/notifications"
                  icon={Bell}
                  label="알림 설정"
                  onClick={() => setUserMenuOpen(false)}
                />
                <hr className="my-1 border-border" />
                {logoutError && (
                  <p role="alert" className="px-4 py-2 text-xs text-destructive">
                    {logoutError}
                  </p>
                )}
                <button
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-surface-muted"
                >
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  {logoutMutation.isPending ? "로그아웃 중..." : "로그아웃"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
