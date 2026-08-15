import { redirect } from "next/navigation";
import { render } from "@testing-library/react";
import Home from "../page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("Home page", () => {
  it("redirects to /home", () => {
    render(<Home />);
    expect(redirect).toHaveBeenCalledWith("/home");
  });
});
