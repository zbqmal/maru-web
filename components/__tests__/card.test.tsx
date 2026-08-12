import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

describe("Card", () => {
  it("renders all sub-components", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>제목</CardTitle>
          <CardDescription>설명</CardDescription>
        </CardHeader>
        <CardContent>내용</CardContent>
        <CardFooter>푸터</CardFooter>
      </Card>,
    );

    expect(screen.getByText("제목")).toBeInTheDocument();
    expect(screen.getByText("설명")).toBeInTheDocument();
    expect(screen.getByText("내용")).toBeInTheDocument();
    expect(screen.getByText("푸터")).toBeInTheDocument();
  });

  it("applies additional className", () => {
    const { container } = render(<Card className="custom-class">내용</Card>);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
