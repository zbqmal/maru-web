import { cn } from "@/lib/utils/tailwind.utils";
import { useState } from "react";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "default" | "lg";
}

const sizeMap = {
  sm: "h-7 w-7 text-xs",
  default: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

const Avatar = ({ src, alt, fallback, size = "default", className, ...props }: AvatarProps) => {
  const [imgError, setImgError] = useState(false);
  const show = src && !imgError;

  return (
    <div
      role="img"
      aria-label={alt ?? fallback}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-medium text-accent-foreground",
        sizeMap[size],
        className
      )}
      {...props}
    >
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? ""}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{fallback?.[0]?.toUpperCase() ?? "?"}</span>
      )}
    </div>
  );
};

export default Avatar;
