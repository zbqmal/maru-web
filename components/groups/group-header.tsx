"use client";

import { Users } from "lucide-react";
import Avatar from "@/components/ui/avatar";
import { useActiveGroupQuery } from "@/hooks/use-groups";

const GroupHeader = () => {
  const { activeGroup, isLoading } = useActiveGroupQuery();

  if (isLoading || !activeGroup) return null;

  const memberCount = activeGroup.memberships.length;

  return (
    <div
      role="region"
      aria-label="선택된 그룹 정보"
      className="flex items-center gap-4 border-b border-border bg-surface px-6 py-4"
    >
      {/* Group avatar */}
      <Avatar
        fallback={activeGroup.name}
        size="lg"
        className="shrink-0 bg-amber-200"
      />

      {/* Group info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          선택된 그룹
        </p>
        <p className="truncate text-lg font-bold leading-tight text-foreground">
          {activeGroup.name}
        </p>
        <p className="text-xs text-muted-foreground">함께한 하루들을 기록하고 있어요 ✨</p>
      </div>

      {/* Member count */}
      <div className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
        <Users className="h-4 w-4" aria-hidden="true" />
        <span>멤버 {memberCount}명</span>
      </div>
    </div>
  );
};

export default GroupHeader;
