"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, HelpCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Avatar from "@/components/ui/avatar";

const NAV_ITEMS = [
  { href: "/diary", label: "오늘의 다이어리", icon: Home },
  { href: "/calendar", label: "달력 보기", icon: CalendarDays },
  { href: "/questions", label: "질문 설정하기", icon: HelpCircle },
];

// Placeholder group & members – will be replaced by real data in a later PR
const MOCK_GROUP = {
  name: "우리 넷",
  members: [
    { id: "1", displayName: "나", avatarUrl: null, isSelf: true },
    { id: "2", displayName: "다연", avatarUrl: null, isSelf: false },
    { id: "3", displayName: "민수", avatarUrl: null, isSelf: false },
    { id: "4", displayName: "지우", avatarUrl: null, isSelf: false },
  ],
};

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-52 shrink-0 flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <Link href="/diary" className="block">
          <p className="text-lg font-bold text-foreground">MARU</p>
          <p className="text-xs text-muted-foreground">우리의 하루를, 함께</p>
        </Link>
      </div>

      {/* Nav */}
      <nav aria-label="주요 메뉴" className="flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-light text-accent-foreground"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Members */}
      <div className="mt-6 flex-1 px-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            함께하는 사람들
          </p>
          <button
            aria-label="그룹원 추가"
            className="rounded-full border border-border p-0.5 text-muted hover:bg-surface-muted"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <ul className="flex flex-col gap-2">
          {MOCK_GROUP.members.map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-sm text-foreground">
              <Avatar fallback={m.displayName} size="sm" />
              <span>{m.displayName}</span>
              {m.isSelf && <span className="text-xs">👑</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* Sidebar footer illustration placeholder */}
      <div className="m-4 rounded-xl bg-surface-muted p-4 text-center">
        <p className="text-xs leading-relaxed text-muted-foreground">
          작은 하루들이 모여
          <br />
          우리를 더 가까이 만들어줘요.
        </p>
        <p className="mt-1 text-base">🪴</p>
      </div>
    </aside>
  );
};

export default Sidebar;
