import { EmptyState } from "@/components/ui/empty-state";

export default function ProfilePage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">내 프로필</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        내 정보를 확인하고 수정할 수 있어요.
      </p>
      <EmptyState
        icon="👤"
        title="프로필을 불러오는 중이에요"
        description="잠시 후 다시 확인해 주세요."
      />
    </div>
  );
}
