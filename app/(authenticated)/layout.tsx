import AppShell from "@/components/layout/app-shell";

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  return <AppShell>{children}</AppShell>;
};

export default AuthenticatedLayout;
