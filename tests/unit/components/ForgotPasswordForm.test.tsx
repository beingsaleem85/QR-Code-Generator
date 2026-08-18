// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

const resetPasswordForEmailMock = vi.fn(() => new Promise(() => {}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { resetPasswordForEmail: resetPasswordForEmailMock } }),
}));

afterEach(() => cleanup());

describe("ForgotPasswordForm", () => {
  it("rejects an invalid email format", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.tab();

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
  });

  it("calls Supabase with a callback redirect and enters the submitting state", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("button", { name: "Sending..." })).toBeDisabled();
    expect(resetPasswordForEmailMock).toHaveBeenCalledWith("person@example.com", {
      redirectTo: expect.stringContaining("/auth/callback?next=/reset-password"),
    });
  });

  it("shows a confirmation message once Supabase responds successfully", async () => {
    resetPasswordForEmailMock.mockResolvedValueOnce({ data: {}, error: null });
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText(/reset link is on its way/i)).toBeInTheDocument();
  });

  it("shows a real error alert when Supabase returns one", async () => {
    resetPasswordForEmailMock.mockResolvedValueOnce({
      data: {},
      error: { message: "Too many requests" },
    });
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Too many requests")).toBeInTheDocument();
  });
});
