import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AuthenticatedAppShell from "@/components/auth/authenticated-app-shell";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

const AuthenticatedLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies();

  if (!cookieStore.has(AUTH_COOKIE_NAME)) {
    redirect("/login");
  }

  return <AuthenticatedAppShell>{children}</AuthenticatedAppShell>;
};

export default AuthenticatedLayout;
