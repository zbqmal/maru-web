const InvitationShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="mb-8 text-center">
        <p className="text-2xl font-bold text-foreground">MARU</p>
        <p className="mt-1 text-sm text-muted-foreground">우리의 하루를, 함께</p>
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm">
        {children}
      </div>
      <footer className="mt-8 text-xs text-muted-foreground">
        © 2026 MARU. All rights reserved.
      </footer>
    </div>
  );
};

export default InvitationShell;
