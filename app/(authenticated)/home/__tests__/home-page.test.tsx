import { render, screen } from "@testing-library/react";
import HomePage from "../page";

describe("HomePage", () => {
  it("renders the page heading", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "홈" })).toBeInTheDocument();
  });

  it("shows the no-group empty state title", () => {
    render(<HomePage />);
    expect(screen.getByText("아직 속한 그룹이 없어요")).toBeInTheDocument();
  });

  it("shows the no-group empty state description", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/그룹을 만들거나 초대 링크로 참여하면/)
    ).toBeInTheDocument();
  });

  it("renders the create group button", () => {
    render(<HomePage />);
    expect(screen.getByRole("button", { name: /그룹 만들기/ })).toBeInTheDocument();
  });

  it("renders the join group button", () => {
    render(<HomePage />);
    expect(screen.getByRole("button", { name: /그룹 참가하기/ })).toBeInTheDocument();
  });

  it("renders the streak placeholder card", () => {
    render(<HomePage />);
    expect(screen.getByText("연속 기록 현황")).toBeInTheDocument();
  });

  it("renders the calendar placeholder card", () => {
    render(<HomePage />);
    expect(screen.getByText("이번 달 기록")).toBeInTheDocument();
  });

  it("renders the right sidebar summary landmark", () => {
    render(<HomePage />);
    expect(screen.getByRole("complementary", { name: "요약 정보" })).toBeInTheDocument();
  });
});
