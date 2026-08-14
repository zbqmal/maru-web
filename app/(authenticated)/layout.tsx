import AuthenticatedAppShell from "@/components/auth/authenticated-app-shell";

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  return <AuthenticatedAppShell>{children}</AuthenticatedAppShell>;
};

export default AuthenticatedLayout;

