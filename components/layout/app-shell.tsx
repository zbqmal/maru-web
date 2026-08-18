"use client";

import type { AuthUser } from "@/lib/api/auth";
import GroupHeader from "@/components/groups/group-header";
import Sidebar from "./sidebar";
import TopNav from "./top-nav";

interface AppShellProps {
  children: React.ReactNode;
  currentUser: AuthUser;
}

const AppShell = ({ children, currentUser }: AppShellProps) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar currentUser={currentUser} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav currentUser={currentUser} />
        <GroupHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
