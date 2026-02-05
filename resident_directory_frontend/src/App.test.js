import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Resident Directory landing", () => {
  render(<App />);
  const title = screen.getByText(/Resident Directory/i);
  expect(title).toBeInTheDocument();
});
