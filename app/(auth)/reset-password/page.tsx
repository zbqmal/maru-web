import { Suspense } from "react";
import ResetPasswordForm from "./reset-password-form";

const ResetPasswordPage = () => {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;
