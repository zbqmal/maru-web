"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGroupsQuery } from "@/hooks/use-groups";
import { useActiveGroupStore } from "@/lib/store/active-group";
import type { Group } from "@/lib/api/groups";
import CreateGroupDialog from "@/components/groups/create-group-dialog";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ErrorState from "@/components/ui/error-state";

type GroupSelectorProps = {
  className?: string;
};

const GroupSelector = ({ className }: GroupSelectorProps) => {
  const { data: groups, isLoading, isError, refetch } = useGroupsQuery();
  const activeGroupId = useActiveGroupStore((s) => s.activeGroupId);
  const setActiveGroupId = useActiveGroupStore((s) => s.setActiveGroupId);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
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

  const activeGroup: Group | undefined = groups?.find((g) => g.id === activeGroupId);

  return (
    <>
      <div className={cn("relative", className)} ref={dropdownRef}>
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
              <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{activeGroup.name}</span>
            </>
          ) : (
            <span>그룹 선택</span>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

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
                <Plus className="h-4 w-4 shrink-0" />
                새 그룹 만들기
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
};

export default GroupSelector;
