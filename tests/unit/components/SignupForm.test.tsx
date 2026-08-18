// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "@/components/auth/SignupForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Never resolves — see LoginForm.test.tsx for why.
const signUpMock = vi.fn(() => new Promise(() => {}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signUp: signUpMock } }),
}));

afterEach(() => cleanup());

describe("SignupForm", () => {
  it("rejects a password under 8 characters", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Password"), "short");
    await user.tab();

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("rejects mismatched passwords", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "correcthorse");
    await user.type(screen.getByLabelText("Confirm password"), "differenthorse");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("accepts valid matching passwords, calls Supabase, and enters the submitting state", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "correcthorse");
    await user.type(screen.getByLabelText("Confirm password"), "correcthorse");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    // Validation passed (no error rendered) and the submit handler actually
    // started running — checked synchronously right after the click so this
    // doesn't depend on real wall-clock timing under parallel test load.
    expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Creating account..." })).toBeDisabled();
    expect(signUpMock).toHaveBeenCalledWith({
      email: "person@example.com",
      password: "correcthorse",
      options: { emailRedirectTo: expect.stringContaining("/auth/callback?next=/dashboard") },
    });
  });

  it("shows a check-your-email message when signup succeeds without an immediate session", async () => {
    signUpMock.mockResolvedValueOnce({
      data: { user: { id: "user-1" }, session: null },
      error: null,
    });
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "correcthorse");
    await user.type(screen.getByLabelText("Confirm password"), "correcthorse");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
  });

  it("shows a real error alert when Supabase rejects the signup", async () => {
    signUpMock.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "correcthorse");
    await user.type(screen.getByLabelText("Confirm password"), "correcthorse");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("User already registered")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeEnabled();
  });
});
