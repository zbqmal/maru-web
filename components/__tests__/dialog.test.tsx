import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog, DialogHeader, DialogTitle, DialogClose, DialogBody, DialogFooter } from "@/components/ui/dialog";

describe("Dialog", () => {
  it("is not rendered when open=false", () => {
    render(
      <Dialog open={false} onClose={jest.fn()}>
        <span>내용</span>
      </Dialog>,
    );
    expect(screen.queryByText("내용")).not.toBeInTheDocument();
  });

  it("renders children when open=true", () => {
    render(
      <Dialog open={true} onClose={jest.fn()}>
        <span>모달 내용</span>
      </Dialog>,
    );
    expect(screen.getByText("모달 내용")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <Dialog open={true} onClose={onClose}>
        <DialogHeader>
          <DialogTitle>제목</DialogTitle>
          <DialogClose onClose={onClose} />
        </DialogHeader>
        <DialogBody>설명</DialogBody>
        <DialogFooter />
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <Dialog open={true} onClose={onClose}>
        <span>내용</span>
      </Dialog>,
    );
    // Click the backdrop (aria-hidden overlay div)
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
