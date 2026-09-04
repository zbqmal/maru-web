import { cn } from "@/lib/utils/tailwind.utils";
import Link from "next/link";

type UserMenuItemProps = {
  href: string;
  icon: React.FC<{ className?: string }>;
  label: string;
  onClick?: () => void;
};

const UserMenuItem = ({ href, icon: Icon, label, onClick }: UserMenuItemProps) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-surface-muted"
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </Link>
  );
};

export default UserMenuItem;
