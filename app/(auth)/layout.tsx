const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden w-2/5 flex-col justify-between bg-[#e8ddd0] p-10 lg:flex">
        <div>
          <p className="text-2xl font-bold text-foreground">MARU</p>
          <p className="mt-1 text-sm text-muted-foreground">우리의 하루를, 함께</p>
        </div>
        <div className="mb-8">
          <p className="text-lg font-semibold leading-snug text-foreground">
            매일의 질문, 우리의 기록.
            <br />
            소중한 사람들과 더 가까워지는 시간.
          </p>
        </div>
        {/* Decorative placeholder */}
        <div className="flex items-end gap-4 text-6xl">🪴☕</div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
          {children}
        </div>
        <footer className="absolute bottom-4 text-xs text-muted-foreground">
          © 2026 MARU. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default AuthLayout;
