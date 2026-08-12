import EmptyState from "@/components/ui/empty-state";

const QuestionsPage = () => {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">질문 설정하기</h1>
      <p className="mb-6 text-sm text-muted-foreground">매일 함께 나눌 질문을 설정해보세요.</p>
      <EmptyState
        icon="❓"
        title="질문을 불러오는 중이에요"
        description="잠시 후 다시 확인해 주세요."
      />
    </div>
  );
};

export default QuestionsPage;
