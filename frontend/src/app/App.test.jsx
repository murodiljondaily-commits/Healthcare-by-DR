import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App.jsx";

test("renders MediSelf onboarding", () => {
  render(React.createElement(App));
  expect(screen.getAllByText(/MediSelf/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/Bugun sog'lomroq yashashni boshlang/i)).toBeInTheDocument();
});
