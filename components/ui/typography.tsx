import { cn } from "@/lib/utils";

type HeadingLevel = "h1" | "h2" | "h3" | "h4";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingLevel;
}

const headingStyles: Record<HeadingLevel, string> = {
  h1: "text-2xl font-bold tracking-tight",
  h2: "text-xl font-semibold tracking-tight",
  h3: "text-lg font-semibold",
  h4: "text-base font-semibold",
};

function Heading({ as = "h2", className, children, ...props }: HeadingProps) {
  const Tag = as;
  return (
    <Tag className={cn(headingStyles[as], className)} {...props}>
      {children}
    </Tag>
  );
}

function Text({
  className,
  muted = false,
  small = false,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & {
  muted?: boolean;
  small?: boolean;
}) {
  return (
    <p
      className={cn(
        small ? "text-xs" : "text-sm",
        muted ? "text-muted-foreground" : "text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Heading, Text };
