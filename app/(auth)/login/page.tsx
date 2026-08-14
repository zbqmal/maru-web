import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "로그인 — MARU" };

const LoginPage = () => {
  return <LoginForm />;
};

export default LoginPage;
