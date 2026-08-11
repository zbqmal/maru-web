import { EmptyState } from "@/components/ui/empty-state";

export default function CalendarPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">달력 보기</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        날짜를 선택하면 그날의 기록을 볼 수 있어요.
      </p>
      <EmptyState
        icon="📅"
        title="달력을 불러오는 중이에요"
        description="잠시 후 다시 확인해 주세요."
      />
    </div>
  );
}
