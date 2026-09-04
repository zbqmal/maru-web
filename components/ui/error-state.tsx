import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/tailwind.utils";
import { Button } from "./button";

interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

const ErrorState = ({
  title = "오류가 발생했어요",
  description = "잠시 후 다시 시도해 주세요.",
  onRetry,
  className,
  ...props
}: ErrorStateProps) => {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center gap-3 py-16 text-center", className)}
      {...props}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </span>
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          다시 시도
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
