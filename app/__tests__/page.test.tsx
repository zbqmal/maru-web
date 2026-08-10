import { render, screen } from "@testing-library/react";
import Home from "../page";

describe("Home page", () => {
  it("renders the app name", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: /maru/i })).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<Home />);
    expect(
      screen.getByText(/a private space to share daily moments/i)
    ).toBeInTheDocument();
  });
});
