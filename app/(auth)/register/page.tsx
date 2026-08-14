import type { Metadata } from "next";
import RegisterForm from "./register-form";

export const metadata: Metadata = { title: "회원가입 — MARU" };

const RegisterPage = () => {
  return <RegisterForm />;
};

export default RegisterPage;
