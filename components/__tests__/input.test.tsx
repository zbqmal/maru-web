import React from "react";
import { render, screen } from "@testing-library/react";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";

describe("Input", () => {
  it("renders with placeholder", () => {
    render(<Input placeholder="이메일을 입력하세요" />);
    expect(
      screen.getByPlaceholderText("이메일을 입력하세요"),
    ).toBeInTheDocument();
  });

  it("renders startIcon when provided", () => {
    render(
      <Input
        placeholder="이메일"
        startIcon={<Mail data-testid="mail-icon" />}
      />,
    );
    expect(screen.getByTestId("mail-icon")).toBeInTheDocument();
  });

  it("forwards ref correctly", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).not.toBeNull();
  });
});
