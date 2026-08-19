// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";

const updateUserMock = vi.fn(() => new Promise(() => {}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { updateUser: updateUserMock } }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ChangePasswordForm", () => {
  it("rejects a password under 8 characters", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "short");
    await user.tab();

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("rejects mismatched passwords", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "correcthorse");
    await user.type(screen.getByLabelText("Confirm new password"), "differenthorse");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("rejects a blank password", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("does not ask for a current password (not required by this project's Auth settings)", () => {
    render(<ChangePasswordForm />);
    expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument();
  });

  it("calls Supabase updateUser and shows a loading state on valid matching passwords", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "correcthorse");
    await user.type(screen.getByLabelText("Confirm new password"), "correcthorse");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByRole("button", { name: "Changing password…" })).toBeDisabled();
    expect(updateUserMock).toHaveBeenCalledWith({ password: "correcthorse" });
  });

  it("shows a success message and clears the fields after a successful change", async () => {
    updateUserMock.mockResolvedValueOnce({ data: { user: {} }, error: null });
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "correcthorse");
    await user.type(screen.getByLabelText("Confirm new password"), "correcthorse");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText("Password updated.")).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toHaveValue("");
    expect(screen.getByLabelText("Confirm new password")).toHaveValue("");
  });

  it("shows Supabase's own safe error message on failure — never a raw exception", async () => {
    updateUserMock.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Password should be at least 6 characters." },
    });
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "correcthorse");
    await user.type(screen.getByLabelText("Confirm new password"), "correcthorse");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(
      await screen.findByText("Password should be at least 6 characters."),
    ).toBeInTheDocument();
  });

  it("clears a stale success/error state once the user starts editing again", async () => {
    updateUserMock.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Something went wrong." },
    });
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "correcthorse");
    await user.type(screen.getByLabelText("Confirm new password"), "correcthorse");
    await user.click(screen.getByRole("button", { name: "Change password" }));
    await screen.findByText("Something went wrong.");

    await user.type(screen.getByLabelText("New password"), "!");

    expect(screen.queryByText("Something went wrong.")).not.toBeInTheDocument();
  });
});
