import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileForm from "../profile-form";

jest.mock("@/lib/api/profile", () => ({
  getProfile: jest.fn(),
  updateProfileName: jest.fn(),
  updateProfileBirthday: jest.fn(),
}));

import { getProfile, updateProfileBirthday, updateProfileName } from "@/lib/api/profile";

const mockGetProfile = getProfile as jest.MockedFunction<typeof getProfile>;
const mockUpdateProfileName = updateProfileName as jest.MockedFunction<typeof updateProfileName>;
const mockUpdateProfileBirthday = updateProfileBirthday as jest.MockedFunction<typeof updateProfileBirthday>;

const profileFixture = {
  id: "1",
  email: "user@example.com",
  name: "홍길동",
  birthday: "1995-10-08",
  profileImageKey: null,
  createdAt: "2026-08-14T00:00:00.000Z",
  updatedAt: "2026-08-14T00:00:00.000Z",
};

const renderProfileForm = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ProfileForm />
    </QueryClientProvider>,
  );
};

describe("ProfileForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProfile.mockResolvedValue(profileFixture);
  });

  it("renders profile fields from the profile query", async () => {
    renderProfileForm();

    expect(await screen.findByDisplayValue("홍길동")).toBeInTheDocument();
    expect(screen.getByDisplayValue("user@example.com")).toBeDisabled();
    expect(screen.getByDisplayValue("1995-10-08")).toBeInTheDocument();
  });

  it("keeps profile image control disabled", async () => {
    renderProfileForm();

    expect(await screen.findByRole("button", { name: "이미지 변경 (준비 중)" })).toBeDisabled();
  });

  it("updates changed name and birthday and shows success message", async () => {
    const user = userEvent.setup();
    mockUpdateProfileName.mockResolvedValue({
      ...profileFixture,
      name: "김마루",
    });
    mockUpdateProfileBirthday.mockResolvedValue({
      ...profileFixture,
      name: "김마루",
      birthday: "1999-01-01",
    });

    renderProfileForm();

    const nameInput = await screen.findByLabelText("이름");
    const birthdayInput = screen.getByLabelText("생일");
    await user.clear(nameInput);
    await user.type(nameInput, "김마루");
    await user.clear(birthdayInput);
    await user.type(birthdayInput, "1999-01-01");
    await user.click(screen.getByRole("button", { name: "저장하기" }));

    await waitFor(() => {
      expect(mockUpdateProfileName).toHaveBeenCalledWith({ name: "김마루" });
      expect(mockUpdateProfileBirthday).toHaveBeenCalledWith({ birthday: "1999-01-01" });
    });
    expect(await screen.findByRole("status")).toHaveTextContent("프로필이 저장되었어요.");
  });

  it("shows a validation error for empty name", async () => {
    const user = userEvent.setup();
    renderProfileForm();

    const nameInput = await screen.findByLabelText("이름");
    await user.clear(nameInput);
    await user.click(screen.getByRole("button", { name: "저장하기" }));

    expect(await screen.findByText("이름을 입력해주세요.")).toBeInTheDocument();
    expect(mockUpdateProfileName).not.toHaveBeenCalled();
  });

  it("shows update error messages", async () => {
    const user = userEvent.setup();
    mockUpdateProfileName.mockRejectedValue(new Error("프로필 수정에 실패했습니다."));
    renderProfileForm();

    const nameInput = await screen.findByLabelText("이름");
    await user.clear(nameInput);
    await user.type(nameInput, "김마루");
    await user.click(screen.getByRole("button", { name: "저장하기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("프로필 수정에 실패했습니다.");
  });
});
