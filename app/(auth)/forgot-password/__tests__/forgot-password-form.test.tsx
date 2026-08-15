import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordForm from "../forgot-password-form";

jest.mock("@/lib/api/auth", () => ({
  forgotPassword: jest.fn(),
}));

import { forgotPassword } from "@/lib/api/auth";
const mockForgotPassword = forgotPassword as jest.MockedFunction<typeof forgotPassword>;

const renderForm = () => render(<ForgotPasswordForm />);

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders email field and submit button", () => {
    renderForm();
    expect(screen.getByLabelText("이메일")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "재설정 링크 보내기" })).toBeInTheDocument();
  });

  it("shows validation error when submitting empty form", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: "재설정 링크 보내기" }));
    expect(await screen.findByText("이메일을 입력해주세요.")).toBeInTheDocument();
    expect(mockForgotPassword).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid email format", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText("이메일"), "notanemail");
    await user.click(screen.getByRole("button", { name: "재설정 링크 보내기" }));
    expect(await screen.findByText("올바른 이메일 형식이 아닙니다.")).toBeInTheDocument();
    expect(mockForgotPassword).not.toHaveBeenCalled();
  });

  it("calls forgotPassword API and shows neutral success message on success", async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockResolvedValueOnce(undefined);

    renderForm();
    await user.type(screen.getByLabelText("이메일"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "재설정 링크 보내기" }));

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith({ email: "user@example.com" });
    });

    // Neutral success message — does not reveal whether account exists
    expect(await screen.findByText("이메일을 확인해주세요")).toBeInTheDocument();
    expect(
      screen.getByText(/비밀번호 재설정 안내를 보내드렸습니다/),
    ).toBeInTheDocument();
  });

  it("shows server error on API failure", async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockRejectedValueOnce(new Error("서버 오류가 발생했습니다."));

    renderForm();
    await user.type(screen.getByLabelText("이메일"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "재설정 링크 보내기" }));

    expect(await screen.findByText("서버 오류가 발생했습니다.")).toBeInTheDocument();
  });

  it("disables submit button while submitting", async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockImplementation(() => new Promise(() => {}));

    renderForm();
    await user.type(screen.getByLabelText("이메일"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "재설정 링크 보내기" }));

    expect(await screen.findByRole("button", { name: "전송 중..." })).toBeDisabled();
  });

  it("has link to /login", () => {
    renderForm();
    expect(screen.getByRole("link", { name: "로그인으로 돌아가기" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
