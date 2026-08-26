import { CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FeedMemberEntry } from "@/lib/api/diary";

export interface FeedMemberCardProps {
  memberEntry: FeedMemberEntry;
  totalQuestions: number;
}

const FeedMemberCard = ({ memberEntry, totalQuestions }: FeedMemberCardProps) => {
  const { user, entry } = memberEntry;
  const answers = entry?.answers ?? [];
  const answeredCount = answers.length;
  const isCompleted = totalQuestions > 0 && answeredCount >= totalQuestions;
  const hasAnyAnswer = answeredCount > 0;

  return (
    <Card
      aria-label={`${user.name}의 오늘 기록`}
      className={cn(
        "border transition-colors",
        isCompleted ? "border-success/30 bg-surface" : "border-border bg-surface"
      )}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-center gap-2">
          <div
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
          >
            {user.name.charAt(0)}
          </div>
          <span className="flex-1 text-sm font-semibold text-foreground">{user.name}</span>
          {isCompleted ? (
            <CheckCircle2
              aria-label="모두 작성 완료"
              className="h-4 w-4 shrink-0 text-success"
              role="img"
            />
          ) : hasAnyAnswer ? (
            <span className="text-xs text-muted-foreground">
              {answeredCount}/{totalQuestions} 작성
            </span>
          ) : (
            <Clock aria-label="아직 미작성" className="h-4 w-4 shrink-0 text-muted-foreground" role="img" />
          )}
        </div>

        {/* Body */}
        {!hasAnyAnswer ? (
          <p className="text-xs text-muted-foreground">아직 오늘의 기록을 남기지 않았어요.</p>
        ) : (
          <ul className="flex flex-col gap-2" aria-label={`${user.name}의 답변 목록`}>
            {answers.map((answer) => (
              <li key={answer.id} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {answer.questionSnapshot}
                </span>
                <p className="text-sm text-foreground">{answer.body}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedMemberCard;
