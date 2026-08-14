import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterForm from "../register-form";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/api/auth", () => ({
  register: jest.fn(),
}));

import { register } from "@/lib/api/auth";
const mockRegister = register as jest.MockedFunction<typeof register>;

describe("RegisterForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders name, email, password fields and submit button", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText("이름")).toBeInTheDocument();
    expect(screen.getByLabelText("이메일")).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "회원가입" })).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.click(screen.getByRole("button", { name: "회원가입" }));
    expect(await screen.findByText("이름을 입력해주세요.")).toBeInTheDocument();
    expect(await screen.findByText("이메일을 입력해주세요.")).toBeInTheDocument();
    expect(await screen.findByText("비밀번호를 입력해주세요.")).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(screen.getByLabelText("이름"), "홍길동");
    await user.type(screen.getByLabelText("이메일"), "bademail");
    await user.type(screen.getByLabelText("비밀번호"), "Str0ng!");
    await user.click(screen.getByRole("button", { name: "회원가입" }));
    expect(await screen.findByText("올바른 이메일 형식이 아닙니다.")).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("shows validation error for too-short password", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(screen.getByLabelText("이름"), "홍길동");
    await user.type(screen.getByLabelText("이메일"), "user@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "short");
    await user.click(screen.getByRole("button", { name: "회원가입" }));
    expect(await screen.findByText("비밀번호는 8자 이상이어야 합니다.")).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("shows validation error for password missing complexity requirements", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(screen.getByLabelText("이름"), "홍길동");
    await user.type(screen.getByLabelText("이메일"), "user@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "alllowercase1!");
    await user.click(screen.getByRole("button", { name: "회원가입" }));
    expect(
      await screen.findByText("비밀번호는 영문 대·소문자, 숫자, 특수문자를 각각 포함해야 합니다.")
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("calls register API and redirects to /diary on success", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce({
      id: "1",
      email: "user@example.com",
      name: "홍길동",
      birthday: null,
      profileImageKey: null,
      createdAt: "",
      updatedAt: "",
    });

    render(<RegisterForm />);
    await user.type(screen.getByLabelText("이름"), "홍길동");
    await user.type(screen.getByLabelText("이메일"), "user@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "Str0ngP@ss");
    await user.click(screen.getByRole("button", { name: "회원가입" }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: "홍길동",
        email: "user@example.com",
        password: "Str0ngP@ss",
      });
      expect(mockPush).toHaveBeenCalledWith("/diary");
    });
  });

  it("shows server error message on API failure", async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce(new Error("이미 사용 중인 이메일입니다."));

    render(<RegisterForm />);
    await user.type(screen.getByLabelText("이름"), "홍길동");
    await user.type(screen.getByLabelText("이메일"), "taken@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "Str0ngP@ss");
    await user.click(screen.getByRole("button", { name: "회원가입" }));

    expect(await screen.findByText("이미 사용 중인 이메일입니다.")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("disables submit button while submitting", async () => {
    const user = userEvent.setup();
    mockRegister.mockImplementation(() => new Promise(() => {})); // never resolves

    render(<RegisterForm />);
    await user.type(screen.getByLabelText("이름"), "홍길동");
    await user.type(screen.getByLabelText("이메일"), "user@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "Str0ngP@ss");
    await user.click(screen.getByRole("button", { name: "회원가입" }));

    expect(await screen.findByRole("button", { name: "가입 중..." })).toBeDisabled();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    const passwordInput = screen.getByLabelText("비밀번호");
    expect(passwordInput).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "비밀번호 보기" }));
    expect(passwordInput).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "비밀번호 숨기기" }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("has link to /login", () => {
    render(<RegisterForm />);
    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute("href", "/login");
  });
});
