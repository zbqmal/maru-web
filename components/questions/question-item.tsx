"use client";

import { ChevronUp, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GroupQuestion } from "@/lib/api/questions";

type QuestionItemProps = {
  question: GroupQuestion;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isLeader: boolean;
  isReordering: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

const QuestionItem = ({
  question,
  index,
  isFirst,
  isLast,
  isLeader,
  isReordering,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: QuestionItemProps) => {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <span className="w-5 shrink-0 text-center text-sm font-medium text-muted-foreground">
        {index + 1}
      </span>
      <span className="flex-1 text-sm text-foreground">{question.question}</span>
      {isLeader && (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="위로 이동"
            disabled={isFirst || isReordering}
            onClick={onMoveUp}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="아래로 이동"
            disabled={isLast || isReordering}
            onClick={onMoveDown}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="질문 수정" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="질문 삭제"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </li>
  );
};

export default QuestionItem;
