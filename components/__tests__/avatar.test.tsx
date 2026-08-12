import { render, screen } from "@testing-library/react";
import Avatar from "@/components/ui/avatar";

describe("Avatar", () => {
  it("renders fallback initial when no src", () => {
    render(<Avatar fallback="다연" alt="다연" />);
    expect(screen.getByRole("img", { name: "다연" })).toBeInTheDocument();
    // Shows first character of fallback
    expect(screen.getByText("다")).toBeInTheDocument();
  });

  it("renders img when src is provided", () => {
    render(<Avatar src="https://example.com/avatar.jpg" alt="프로필" fallback="나" />);
    const imgs = screen.getAllByRole("img", { name: "프로필" });
    // The outer container div is the first match
    const container = imgs[0] as HTMLElement;
    expect(container.querySelector("img")).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });
});
