// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/LoginForm";

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

// Never resolves — lets tests assert the synchronous submitting-state
// transition without depending on real wall-clock timing (established
// Module 2.5 lesson: don't wait on setTimeout-backed async work).
const signInWithPasswordMock = vi.fn(() => new Promise(() => {}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithPassword: signInWithPasswordMock } }),
}));

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

  it("accepts valid input, calls Supabase, and enters the submitting state", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("button", { name: "Signing in..." })).toBeDisabled();
    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "person@example.com",
      password: "hunter2",
    });
  });

  it("shows a real error alert and re-enables the form when Supabase rejects the credentials", async () => {
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Invalid login credentials")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();
  });
});
