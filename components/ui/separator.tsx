import { cn } from "@/lib/utils";

interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical";
}

const Separator = ({ orientation = "horizontal", className, ...props }: SeparatorProps) => {
  return (
    <hr
      aria-orientation={orientation}
      className={cn(
        "shrink-0 border-none bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  );
};

export default Separator;
