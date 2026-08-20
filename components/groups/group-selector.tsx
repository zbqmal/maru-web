"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Plus, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveGroupQuery } from "@/hooks/use-groups";
import { useActiveGroupStore } from "@/lib/store/active-group";
import CreateGroupDialog from "@/components/groups/create-group-dialog";
import LeaveGroupDialog from "@/components/groups/leave-group-dialog";
import DeleteGroupDialog from "@/components/groups/delete-group-dialog";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ErrorState from "@/components/ui/error-state";
import Avatar from "../ui/avatar";
import { useCurrentUserQuery } from "@/hooks/use-current-user";

type GroupSelectorProps = {
  className?: string;
};

const GroupSelector = ({ className }: GroupSelectorProps) => {
  const { groups, activeGroupId, activeGroup, isLoading, isError, refetch } = useActiveGroupQuery();
  const setActiveGroupId = useActiveGroupStore((s) => s.setActiveGroupId);
  const { data: currentUser } = useCurrentUserQuery();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-select the first group when groups load and no group is active
  useEffect(() => {
    if (!groups || groups.length === 0) return;
    const ids = groups.map((g) => g.id);
    if (!activeGroupId || !ids.includes(activeGroupId)) {
      setActiveGroupId(groups[0].id);
    }
  }, [groups, activeGroupId, setActiveGroupId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <LoadingSpinner label="그룹 불러오는 중..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn(className)}>
        <ErrorState
          title="그룹을 불러올 수 없어요"
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  const isActiveGroupLeader =
    !!activeGroup &&
    !!currentUser &&
    activeGroup.memberships.some(
      (membership) => membership.userId === currentUser.id && membership.role === "LEADER"
    );

  return (
    <>
      <div className={cn("relative", className)} ref={dropdownRef}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            aria-label="그룹 선택"
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold",
              "hover:bg-surface-muted transition-colors",
              activeGroup ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {activeGroup ? (
              <>
                <Avatar fallback={activeGroup.name} size="default" className="bg-amber-200" />
                <span>{activeGroup.name}</span>
              </>
            ) : (
              <span>그룹 선택</span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {activeGroup && (
            <span className="ml-4 flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-4 w-4" aria-hidden="true" />
              멤버 {activeGroup.memberships.length}명
            </span>
          )}
        </div>

        {dropdownOpen && (
          <div
            role="listbox"
            aria-label="그룹 목록"
            className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-border bg-surface shadow-md"
          >
            {groups && groups.length > 0 ? (
              <ul className="py-1">
                {groups.map((group) => (
                  <li key={group.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={group.id === activeGroupId}
                      onClick={() => {
                        setActiveGroupId(group.id);
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-4 py-2 text-sm",
                        "hover:bg-surface-muted transition-colors",
                        group.id === activeGroupId
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      <Users className="h-4 w-4 shrink-0" />
                      {group.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-xs text-muted-foreground">속한 그룹이 없어요</p>
            )}

            <div className="border-t border-border py-1">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  setCreateOpen(true);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4 shrink-0" />새 그룹 만들기
              </button>
              {activeGroup && (
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    setLeaveOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-surface-muted transition-colors"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  그룹 나가기
                </button>
              )}
              {isActiveGroupLeader && (
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    setDeleteOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-surface-muted transition-colors"
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                  그룹 삭제
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
      {activeGroup && currentUser && (
        <LeaveGroupDialog
          open={leaveOpen}
          onOpenChange={setLeaveOpen}
          group={activeGroup}
          currentUserId={currentUser.id}
        />
      )}
      {activeGroup && currentUser && (
        <DeleteGroupDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          group={activeGroup}
          currentUserId={currentUser.id}
        />
      )}
    </>
  );
};

export default GroupSelector;
