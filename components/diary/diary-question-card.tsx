"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GroupQuestion } from "@/lib/api/questions";
import type { DiaryAnswer } from "@/lib/api/diary";

export interface DiaryQuestionCardProps {
  question: GroupQuestion;
  index: number;
  existingAnswer: DiaryAnswer | undefined;
  onSubmit: (questionId: string, body: string) => Promise<void>;
}

const DiaryQuestionCard = ({
  question,
  index,
  existingAnswer,
  onSubmit,
}: DiaryQuestionCardProps) => {
  const isCompleted = !!existingAnswer;
  const [isExpanded, setIsExpanded] = useState(false);
  const [body, setBody] = useState(existingAnswer?.body ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  const handleToggle = () => {
    if (isExpanded) {
      // Reset draft to saved answer when collapsing
      setBody(existingAnswer?.body ?? "");
    }
    setIsExpanded((prev) => !prev);
  };

  const handleSubmit = async () => {
    const trimmed = body.trim();

    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await onSubmit(question.id, trimmed);
      setIsExpanded(false);
    } catch {
      // keep the card expanded so the user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <li
      className={cn(
        "rounded-xl border transition-colors",
        isExpanded
          ? "border-primary bg-surface shadow-sm"
          : "border-border bg-surface hover:border-primary/50"
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls={`diary-answer-${question.id}`}
      >
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">
          질문 {index + 1}
        </span>
        <p className="flex-1 text-sm font-medium text-foreground">{question.question}</p>
        {isCompleted && !isExpanded && (
          <CheckCircle2
            role="img"
            aria-label="작성 완료"
            className="h-4 w-4 shrink-0 text-success"
          />
        )}
      </button>

      {isExpanded && (
        <div id={`diary-answer-${question.id}`} className="flex flex-col gap-3 px-4 pb-4">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className={cn(
              "w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-label={`질문 ${index + 1} 답변 입력`}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={!body.trim() || isSubmitting}
              onClick={() => void handleSubmit()}
            >
              {isCompleted ? "수정하기" : "답변하기"}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
};

export default DiaryQuestionCard;
