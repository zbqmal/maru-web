"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { useEffect } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  /** The `id` of the DialogTitle element, used for aria-labelledby */
  titleId?: string;
}

const Dialog = ({ open, onClose, children, className, titleId }: DialogProps) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-4", className)} {...props} />
  );
};

const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
};

const DialogClose = ({ onClose }: { onClose: () => void }) => {
  return (
    <Button variant="ghost" size="icon" onClick={onClose} aria-label="닫기" className="shrink-0">
      <X className="h-4 w-4" />
    </Button>
  );
};

const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />;
};

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("mt-6 flex justify-end gap-2", className)} {...props} />;
};

export { Dialog, DialogHeader, DialogTitle, DialogClose, DialogBody, DialogFooter };
