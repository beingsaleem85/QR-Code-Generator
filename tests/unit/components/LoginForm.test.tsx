// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/LoginForm";

afterEach(() => cleanup());

describe("LoginForm", () => {
  it("shows inline validation errors for empty required fields on blur", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByLabelText("Email"));
    await user.tab();

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
  });

  it("rejects an invalid email format", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.tab();

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByLabelText("Show password"));

    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("accepts valid input and enters the submitting state", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    // Checked synchronously right after the click, not after the fake
    // network delay resolves — deterministic regardless of system load.
    expect(await screen.findByRole("button", { name: "Signing in..." })).toBeDisabled();
  });
});
