"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import ErrorState from "@/components/ui/error-state";
import LoadingSpinner from "@/components/ui/loading-spinner";
import FeedMemberCard from "@/components/diary/feed-member-card";
import { useGroupDailyFeedQuery } from "@/hooks/use-group-daily-feed";

export interface GroupDailyFeedProps {
  groupId: string;
  date: string;
  totalQuestions: number;
}

const GroupDailyFeed = ({ groupId, date, totalQuestions }: GroupDailyFeedProps) => {
  const { data, isLoading, isError, refetch } = useGroupDailyFeedQuery(groupId, date);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">오늘의 기록</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSpinner label="오늘의 기록을 불러오는 중..." />
        ) : isError ? (
          <ErrorState
            description="오늘의 기록을 불러오지 못했어요."
            onRetry={() => void refetch()}
          />
        ) : !data || data.members.length === 0 ? (
          <EmptyState
            icon="📝"
            title="아직 기록이 없어요"
            description="멤버들의 오늘 기록이 여기에 나타나요."
            className="py-10"
          />
        ) : (
          <ul aria-label="오늘의 기록 목록" className="flex flex-col gap-3">
            {data.members.map((memberEntry) => (
              <li key={memberEntry.userId}>
                <FeedMemberCard memberEntry={memberEntry} totalQuestions={totalQuestions} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default GroupDailyFeed;
