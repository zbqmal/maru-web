import { Suspense } from "react";
import ForgotPasswordForm from "./forgot-password-form";

const ForgotPasswordPage = () => {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
};

export default ForgotPasswordPage;
