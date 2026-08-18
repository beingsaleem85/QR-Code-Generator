// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const updateUserMock = vi.fn(() => new Promise(() => {}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { updateUser: updateUserMock } }),
}));

afterEach(() => cleanup());

describe("ResetPasswordForm", () => {
  it("rejects a password under 8 characters", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("New password"), "short");
    await user.tab();

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("rejects mismatched passwords", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("New password"), "correcthorse");
    await user.type(screen.getByLabelText("Confirm new password"), "differenthorse");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("calls Supabase and enters the submitting state on valid matching passwords", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("New password"), "correcthorse");
    await user.type(screen.getByLabelText("Confirm new password"), "correcthorse");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByRole("button", { name: "Resetting..." })).toBeDisabled();
    expect(updateUserMock).toHaveBeenCalledWith({ password: "correcthorse" });
  });

  it("shows a real error alert when there's no valid recovery session", async () => {
    updateUserMock.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Auth session missing!" },
    });
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("New password"), "correcthorse");
    await user.type(screen.getByLabelText("Confirm new password"), "correcthorse");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByText("Auth session missing!")).toBeInTheDocument();
  });
});
