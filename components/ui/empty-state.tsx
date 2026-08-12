import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState = ({ icon, title, description, action, className, ...props }: EmptyStateProps) => {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 py-16 text-center", className)}
      {...props}
    >
      {icon && (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted text-2xl">
          {icon}
        </span>
      )}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
