import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "../login-form";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/api/auth", () => ({
  login: jest.fn(),
}));

import { login } from "@/lib/api/auth";
const mockLogin = login as jest.MockedFunction<typeof login>;

const renderLoginForm = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LoginForm />
    </QueryClientProvider>
  );
};

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders email, password fields and submit button", () => {
    renderLoginForm();
    expect(screen.getByLabelText("이메일")).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    const user = userEvent.setup();
    renderLoginForm();
    await user.click(screen.getByRole("button", { name: "로그인" }));
    expect(await screen.findByText("이메일을 입력해주세요.")).toBeInTheDocument();
    expect(await screen.findByText("비밀번호를 입력해주세요.")).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid email format", async () => {
    const user = userEvent.setup();
    renderLoginForm();
    await user.type(screen.getByLabelText("이메일"), "notanemail");
    await user.type(screen.getByLabelText("비밀번호"), "password");
    await user.click(screen.getByRole("button", { name: "로그인" }));
    expect(await screen.findByText("올바른 이메일 형식이 아닙니다.")).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("calls login API and redirects to /diary on success", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({
      id: "1",
      email: "user@example.com",
      name: "User",
      birthday: null,
      profileImageKey: null,
      createdAt: "",
      updatedAt: "",
    });

    renderLoginForm();
    await user.type(screen.getByLabelText("이메일"), "user@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "password");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password",
      });
      expect(mockPush).toHaveBeenCalledWith("/diary");
    });
  });

  it("shows server error message on API failure", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(new Error("이메일 또는 비밀번호가 올바르지 않습니다."));

    renderLoginForm();
    await user.type(screen.getByLabelText("이메일"), "user@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "wrongpassword");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(
      await screen.findByText("이메일 또는 비밀번호가 올바르지 않습니다.")
    ).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("disables submit button while submitting", async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(() => new Promise(() => {})); // never resolves

    renderLoginForm();
    await user.type(screen.getByLabelText("이메일"), "user@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "password");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByRole("button", { name: "로그인 중..." })).toBeDisabled();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    renderLoginForm();
    const passwordInput = screen.getByLabelText("비밀번호");
    expect(passwordInput).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "비밀번호 보기" }));
    expect(passwordInput).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "비밀번호 숨기기" }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("has link to /register", () => {
    renderLoginForm();
    expect(screen.getByRole("link", { name: "회원가입" })).toHaveAttribute("href", "/register");
  });
});
