import { EmptyState } from "@/components/ui/empty-state";

export default function DiaryPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">오늘의 다이어리</h1>
      <p className="mb-6 text-sm text-muted-foreground">오늘도 기록해볼까요? ☀️</p>
      <EmptyState
        icon="📖"
        title="아직 오늘의 기록이 없어요"
        description="질문에 답하며 오늘 하루를 기록해 보세요."
      />
    </div>
  );
}
