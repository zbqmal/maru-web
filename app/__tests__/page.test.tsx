import { redirect } from "next/navigation";
import { render } from "@testing-library/react";
import Home from "../page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("Root page", () => {
  it("redirects to /diary", () => {
    render(<Home />);
    expect(redirect).toHaveBeenCalledWith("/diary");
  });
});
