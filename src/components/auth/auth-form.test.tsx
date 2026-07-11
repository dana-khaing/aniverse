import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthForm } from "./auth-form";

describe("AuthForm", () => {
  it("renders the sign-in controls and recovery path", () => {
    render(<AuthForm mode="sign-in" />);
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Email address" })).toBeRequired();
    expect(screen.getByLabelText("Password")).toHaveAttribute("minLength", "8");
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/recover");
  });

  it("renders creator-friendly registration copy", () => {
    render(<AuthForm mode="sign-up" />);
    expect(screen.getByRole("heading", { name: "Join the universe" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create account/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in");
  });
});
