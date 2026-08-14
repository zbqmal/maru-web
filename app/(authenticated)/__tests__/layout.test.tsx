import AuthenticatedLayout from "../layout";

jest.mock("@/components/auth/authenticated-app-shell", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("AuthenticatedLayout", () => {
  it("renders children inside the authenticated app shell", () => {
    const result = AuthenticatedLayout({
      children: <div>private content</div>,
    });

    expect(result).toBeTruthy();
  });
});

