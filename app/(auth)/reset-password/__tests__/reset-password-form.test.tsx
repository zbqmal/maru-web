import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api/errors";
import ResetPasswordForm from "../reset-password-form";

const mockSearchParamsGet = jest.fn();

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockSearchParamsGet }),
}));

jest.mock("@/lib/api/auth", () => ({
  resetPassword: jest.fn(),
}));

import { resetPassword } from "@/lib/api/auth";
const mockResetPassword = resetPassword as jest.MockedFunction<typeof resetPassword>;

const renderForm = () => render(<ResetPasswordForm />);

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when no token in URL", () => {
    beforeEach(() => {
      mockSearchParamsGet.mockReturnValue(null);
    });

    it("shows invalid link message and link to forgot-password", () => {
      renderForm();
      expect(screen.getByText("유효하지 않은 링크")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "비밀번호 재설정 다시 요청하기" }),
      ).toHaveAttribute("href", "/forgot-password");
    });
  });

  describe("when token is present in URL", () => {
    beforeEach(() => {
      mockSearchParamsGet.mockImplementation((key: string) =>
        key === "token" ? "valid-reset-token" : null,
      );
    });

    it("renders new password field and submit button", () => {
      renderForm();
      expect(screen.getByLabelText("새 비밀번호")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "비밀번호 변경" })).toBeInTheDocument();
    });

    it("shows validation error when submitting empty form", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.click(screen.getByRole("button", { name: "비밀번호 변경" }));
      expect(await screen.findByText("비밀번호를 입력해주세요.")).toBeInTheDocument();
      expect(mockResetPassword).not.toHaveBeenCalled();
    });

    it("shows validation error for short password", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.type(screen.getByLabelText("새 비밀번호"), "short");
      await user.click(screen.getByRole("button", { name: "비밀번호 변경" }));
      expect(await screen.findByText("비밀번호는 8자 이상이어야 합니다.")).toBeInTheDocument();
      expect(mockResetPassword).not.toHaveBeenCalled();
    });

    it("shows validation error for password not meeting complexity requirements", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.type(screen.getByLabelText("새 비밀번호"), "alllowercase");
      await user.click(screen.getByRole("button", { name: "비밀번호 변경" }));
      expect(
        await screen.findByText(
          "비밀번호는 영문 대·소문자, 숫자, 특수문자를 각각 포함해야 합니다.",
        ),
      ).toBeInTheDocument();
      expect(mockResetPassword).not.toHaveBeenCalled();
    });

    it("calls resetPassword API with token and new password on success", async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValueOnce(undefined);

      renderForm();
      await user.type(screen.getByLabelText("새 비밀번호"), "NewStr0ng!");
      await user.click(screen.getByRole("button", { name: "비밀번호 변경" }));

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith({
          token: "valid-reset-token",
          newPassword: "NewStr0ng!",
        });
      });

      expect(await screen.findByText("비밀번호가 변경되었습니다")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "로그인하기" })).toHaveAttribute("href", "/login");
    });

    it("shows expired/invalid token state on 400 error", async () => {
      const user = userEvent.setup();
      mockResetPassword.mockRejectedValueOnce(
        new ApiError("Invalid or expired token", 400, null),
      );

      renderForm();
      await user.type(screen.getByLabelText("새 비밀번호"), "NewStr0ng!");
      await user.click(screen.getByRole("button", { name: "비밀번호 변경" }));

      expect(await screen.findByText("링크가 만료되었습니다")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "비밀번호 재설정 다시 요청하기" }),
      ).toHaveAttribute("href", "/forgot-password");
    });

    it("shows expired/invalid token state on 404 error", async () => {
      const user = userEvent.setup();
      mockResetPassword.mockRejectedValueOnce(
        new ApiError("Token not found", 404, null),
      );

      renderForm();
      await user.type(screen.getByLabelText("새 비밀번호"), "NewStr0ng!");
      await user.click(screen.getByRole("button", { name: "비밀번호 변경" }));

      expect(await screen.findByText("링크가 만료되었습니다")).toBeInTheDocument();
    });

    it("shows server error on generic API failure", async () => {
      const user = userEvent.setup();
      mockResetPassword.mockRejectedValueOnce(new Error("서버 오류가 발생했습니다."));

      renderForm();
      await user.type(screen.getByLabelText("새 비밀번호"), "NewStr0ng!");
      await user.click(screen.getByRole("button", { name: "비밀번호 변경" }));

      expect(await screen.findByText("서버 오류가 발생했습니다.")).toBeInTheDocument();
    });

    it("disables submit button while submitting", async () => {
      const user = userEvent.setup();
      mockResetPassword.mockImplementation(() => new Promise(() => {}));

      renderForm();
      await user.type(screen.getByLabelText("새 비밀번호"), "NewStr0ng!");
      await user.click(screen.getByRole("button", { name: "비밀번호 변경" }));

      expect(await screen.findByRole("button", { name: "변경 중..." })).toBeDisabled();
    });

    it("toggles password visibility", async () => {
      const user = userEvent.setup();
      renderForm();
      const passwordInput = screen.getByLabelText("새 비밀번호");
      expect(passwordInput).toHaveAttribute("type", "password");
      await user.click(screen.getByRole("button", { name: "비밀번호 보기" }));
      expect(passwordInput).toHaveAttribute("type", "text");
      await user.click(screen.getByRole("button", { name: "비밀번호 숨기기" }));
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("has link to /login", () => {
      renderForm();
      expect(screen.getByRole("link", { name: "로그인으로 돌아가기" })).toHaveAttribute(
        "href",
        "/login",
      );
    });
  });
});
