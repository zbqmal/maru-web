import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/tailwind.utils";
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
      <CardContent className="flex gap-10 p-4">
        {/* Header */}
        <div className="w-30 mb-3 flex items-start gap-2">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary break-all"
          >
            {user.name.charAt(0)}
          </span>
          <span className="flex-1 pt-[5px] text-sm font-semibold text-foreground">{user.name}</span>
        </div>

        {/* Body */}
        {!hasAnyAnswer ? (
          <p className="text-xs text-muted-foreground">아직 오늘의 기록을 남기지 않았어요.</p>
        ) : (
          <ul className="flex flex-col gap-2" aria-label={`${user.name}의 답변 목록`}>
            {answers.map((answer) => (
              <li key={answer.id} className="flex flex-col gap-2 py-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {answer.questionSnapshot}
                </span>
                <p className="text-sm text-foreground pl-2">{answer.body}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedMemberCard;
