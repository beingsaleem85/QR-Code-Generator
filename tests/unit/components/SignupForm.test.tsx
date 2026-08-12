// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "@/components/auth/SignupForm";

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

  it("accepts valid matching passwords and enters the submitting state", async () => {
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
  });
});
