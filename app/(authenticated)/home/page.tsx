"use client";

import { useState } from "react";
import { Users, Plus, LogIn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import GroupSelector from "@/components/groups/group-selector";
import CreateGroupDialog from "@/components/groups/create-group-dialog";
import { useGroupsQuery } from "@/hooks/use-groups";
import { useActiveGroupStore } from "@/lib/store/active-group";

const StreakPlaceholderCard = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-sm">
        <span aria-hidden="true">🔥</span>
        연속 기록 현황
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-sm">그룹에 참여하면 연속 기록을 확인할 수 있어요.</p>
    </CardContent>
  </Card>
);

const CalendarPlaceholderCard = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-sm">
        <span aria-hidden="true">📅</span>
        이번 달 기록
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-sm">그룹에 참여하면 달력에서 기록을 확인할 수 있어요.</p>
    </CardContent>
  </Card>
);

const HomePage = () => {
  const { data: groups, isLoading } = useGroupsQuery();
  const activeGroupId = useActiveGroupStore((s) => s.activeGroupId);
  const [createOpen, setCreateOpen] = useState(false);

  const hasGroups = !isLoading && groups && groups.length > 0;
  const activeGroup = groups?.find((g) => g.id === activeGroupId);

  return (
    <div className="flex gap-6 h-full">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-xl font-bold">홈</h1>
            <p className="text-sm text-muted-foreground">오늘도 함께 기록해 볼까요? 🪴</p>
          </div>
          {hasGroups && <GroupSelector />}
        </div>

        {hasGroups && activeGroup ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">{activeGroup.name}</p>
                  <p className="text-xs text-muted-foreground">
                    멤버 {activeGroup.memberships.length}명
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                오늘의 다이어리 기능은 곧 추가될 예정이에요. 📝
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={<Users className="h-7 w-7 text-muted-foreground" />}
                title="아직 속한 그룹이 없어요"
                description="그룹을 만들거나 초대 링크로 참여하면 함께 하루를 기록할 수 있어요."
                action={
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button size="default" onClick={() => setCreateOpen(true)}>
                      <Plus className="h-4 w-4" />
                      그룹 만들기
                    </Button>
                    <Button variant="outline" size="default">
                      <LogIn className="h-4 w-4" />
                      그룹 참가하기
                    </Button>
                  </div>
                }
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right sidebar */}
      <aside aria-label="요약 정보" className="hidden w-64 shrink-0 flex-col gap-4 lg:flex">
        <StreakPlaceholderCard />
        <CalendarPlaceholderCard />
      </aside>

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

export default HomePage;
