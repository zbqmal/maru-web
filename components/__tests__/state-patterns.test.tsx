import { render, screen } from "@testing-library/react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import EmptyState from "@/components/ui/empty-state";
import ErrorState from "@/components/ui/error-state";

describe("LoadingSpinner", () => {
  it("renders with default label", () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole("status", { name: "로딩 중..." })).toBeInTheDocument();
  });

  it("renders with custom label", () => {
    render(<LoadingSpinner label="불러오는 중..." />);
    expect(screen.getByRole("status", { name: "불러오는 중..." })).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState icon="📖" title="아직 기록이 없어요" description="첫 번째 기록을 남겨보세요." />
    );
    expect(screen.getByText("아직 기록이 없어요")).toBeInTheDocument();
    expect(screen.getByText("첫 번째 기록을 남겨보세요.")).toBeInTheDocument();
  });

  it("renders action slot", () => {
    render(<EmptyState title="비어있음" action={<button>시작하기</button>} />);
    expect(screen.getByRole("button", { name: "시작하기" })).toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("renders default title and description", () => {
    render(<ErrorState />);
    expect(screen.getByText("오류가 발생했어요")).toBeInTheDocument();
    expect(screen.getByText("잠시 후 다시 시도해 주세요.")).toBeInTheDocument();
  });

  it("renders retry button when onRetry provided", async () => {
    const onRetry = jest.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
  });
});
