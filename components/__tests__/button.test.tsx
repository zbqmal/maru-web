import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>로그인</Button>);
    expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Button onClick={onClick}>클릭</Button>);
    await user.click(screen.getByRole("button", { name: "클릭" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>저장</Button>);
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("applies variant classes", () => {
    const { container } = render(<Button variant="outline">취소</Button>);
    expect(container.firstChild).toHaveClass("border");
  });
});
