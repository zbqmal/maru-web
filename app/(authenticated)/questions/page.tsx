"use client";

import { useState } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import ErrorState from "@/components/ui/error-state";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import QuestionItem from "@/components/questions/question-item";
import AddEditQuestionDialog from "@/components/questions/add-edit-question-dialog";
import DeleteQuestionDialog from "@/components/questions/delete-question-dialog";
import { useActiveGroupQuery } from "@/hooks/use-groups";
import { useCurrentUserQuery } from "@/hooks/use-current-user";
import {
  useQuestionsQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useReorderQuestionsMutation,
} from "@/hooks/use-questions";
import type { GroupQuestion } from "@/lib/api/questions";
import QuestionTip from "@/components/questions/question-tip";

const MAX_QUESTIONS = 4;

const GUIDE_ITEMS = [
  `최대 ${MAX_QUESTIONS}개의 질문만 설정할 수 있어요.`,
  "질문은 매일 모든 멤버에게 동일하게 표시돼요.",
  "질문 순서는 위아래 버튼으로 변경할 수 있어요.",
];

type EditTarget = { id: string; question: string };
type DeleteTarget = { id: string; question: string };

const QuestionsPage = () => {
  const { data: currentUser } = useCurrentUserQuery();
  const { activeGroup } = useActiveGroupQuery();

  const groupId = activeGroup?.id ?? null;
  const currentMembership = activeGroup?.memberships.find((m) => m.userId === currentUser?.id);
  const isLeader = currentMembership?.role === "LEADER";

  const { data: questions, isLoading, isError, refetch } = useQuestionsQuery(groupId);

  const createMutation = useCreateQuestionMutation(groupId ?? "");
  const updateMutation = useUpdateQuestionMutation(groupId ?? "");
  const deleteMutation = useDeleteQuestionMutation(groupId ?? "");
  const reorderMutation = useReorderQuestionsMutation(groupId ?? "");

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const sortedQuestions: GroupQuestion[] = questions
    ? [...questions].sort((a, b) => a.displayOrder - b.displayOrder)
    : [];

  const atMax = sortedQuestions.length >= MAX_QUESTIONS;

  const handleAdd = (question: string) => {
    createMutation.mutate({ question }, { onSuccess: () => setAddOpen(false) });
  };

  const handleEdit = (question: string) => {
    if (!editTarget) return;
    updateMutation.mutate(
      { questionId: editTarget.id, question },
      { onSuccess: () => setEditTarget(null) }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const ids = sortedQuestions.map((q) => q.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [ids[index], ids[swapIndex]] = [ids[swapIndex], ids[index]];
    reorderMutation.mutate({ questionIds: ids });
  };

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="mb-6">
          <h1 className="mb-1 text-xl font-bold">질문 설정하기</h1>
          <p className="text-sm text-muted-foreground">매일 함께 나눌 질문을 설정해보세요.</p>
        </div>

        {!groupId ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon="❓"
                title="그룹을 먼저 선택해주세요"
                description="질문 설정은 그룹에 참여한 후 사용할 수 있어요."
              />
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardContent className="p-0">
              <LoadingSpinner label="질문을 불러오는 중..." />
            </CardContent>
          </Card>
        ) : isError ? (
          <Card>
            <CardContent className="p-0">
              <ErrorState description="질문을 불러오지 못했어요." onRetry={() => refetch()} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">질문 리스트 (최대 {MAX_QUESTIONS}개)</CardTitle>
                <span className="text-sm font-medium text-muted-foreground">
                  {sortedQuestions.length} / {MAX_QUESTIONS}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {sortedQuestions.length === 0 ? (
                <EmptyState
                  icon="💬"
                  title="아직 설정된 질문이 없어요"
                  description={
                    isLeader
                      ? "질문을 추가해서 함께 나눌 이야기를 만들어보세요."
                      : "리더가 질문을 추가하면 여기에 표시돼요."
                  }
                  className="py-10"
                />
              ) : (
                <ul className="flex flex-col gap-2" aria-label="질문 목록">
                  {sortedQuestions.map((q, i) => (
                    <QuestionItem
                      key={q.id}
                      question={q}
                      index={i}
                      isFirst={i === 0}
                      isLast={i === sortedQuestions.length - 1}
                      isLeader={isLeader}
                      isReordering={reorderMutation.isPending}
                      onMoveUp={() => handleMove(i, "up")}
                      onMoveDown={() => handleMove(i, "down")}
                      onEdit={() => setEditTarget({ id: q.id, question: q.question })}
                      onDelete={() => setDeleteTarget({ id: q.id, question: q.question })}
                    />
                  ))}
                </ul>
              )}

              {isLeader && (
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  disabled={atMax || createMutation.isPending}
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  {atMax ? `질문 추가하기 (최대 ${MAX_QUESTIONS}개)` : "질문 추가하기"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Setting guide */}
        {groupId && !isLoading && !isError && (
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">설정 안내</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {GUIDE_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right sidebar */}
      {groupId && !isLoading && !isError && <QuestionTip isLeader={isLeader} />}

      {/* Dialogs */}
      <AddEditQuestionDialog
        key={addOpen ? "add-open" : "add-closed"}
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="add"
        isPending={createMutation.isPending}
        error={createMutation.error}
        onSubmit={handleAdd}
      />

      <AddEditQuestionDialog
        key={editTarget ? `edit-${editTarget.id}` : "edit-closed"}
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        mode="edit"
        initialValue={editTarget?.question ?? ""}
        isPending={updateMutation.isPending}
        error={updateMutation.error}
        onSubmit={handleEdit}
      />

      {deleteTarget && (
        <DeleteQuestionDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          question={deleteTarget.question}
          isPending={deleteMutation.isPending}
          error={deleteMutation.error}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default QuestionsPage;
