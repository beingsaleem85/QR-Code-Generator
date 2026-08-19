// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountProfileForm } from "@/components/account/AccountProfileForm";

const { updateDisplayName, refresh } = vi.hoisted(() => ({
  updateDisplayName: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/account/actions", () => ({ updateDisplayName }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const NAME = "Jordan Rivera";
const EMAIL = "jordan.rivera@example.com";

describe("AccountProfileForm", () => {
  it("pre-fills the real display name and shows a read-only email address", () => {
    render(<AccountProfileForm initialDisplayName={NAME} email={EMAIL} />);

    expect(screen.getByLabelText("Display name")).toHaveValue(NAME);
    expect(screen.getByLabelText("Email address")).toHaveValue(EMAIL);
    expect(screen.getByLabelText("Email address")).toBeDisabled();
  });

  it("never shows the old Module 3.1 placeholder language", () => {
    render(<AccountProfileForm initialDisplayName={NAME} email={EMAIL} />);

    expect(screen.queryByText(/module 3\.1/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/profile updates aren't connected to a backend/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/email changes will be available once sign-in is connected/i),
    ).not.toBeInTheDocument();
  });

  it("rejects empty/whitespace-only display names", async () => {
    const user = userEvent.setup();
    render(<AccountProfileForm initialDisplayName={NAME} email={EMAIL} />);

    await user.clear(screen.getByLabelText("Display name"));
    await user.type(screen.getByLabelText("Display name"), "   ");
    await user.tab();

    expect(await screen.findByText("Enter a display name")).toBeInTheDocument();
    expect(updateDisplayName).not.toHaveBeenCalled();
  });

  it("shows a saving state, then persists the change via the real server action", async () => {
    let resolveSave!: (value: { data: { displayName: string } }) => void;
    updateDisplayName.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<AccountProfileForm initialDisplayName={NAME} email={EMAIL} />);

    await user.clear(screen.getByLabelText("Display name"));
    await user.type(screen.getByLabelText("Display name"), "New Name");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(updateDisplayName).toHaveBeenCalledWith("New Name");

    resolveSave({ data: { displayName: "New Name" } });
    await screen.findByText("Profile updated.");
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("shows a safe, user-friendly message on a backend error — never a raw error", async () => {
    updateDisplayName.mockResolvedValue({
      error: "Couldn't save your changes — please try again.",
    });
    const user = userEvent.setup();
    render(<AccountProfileForm initialDisplayName={NAME} email={EMAIL} />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await screen.findByText("Couldn't save your changes — please try again.");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("clears a previous save state once the user starts editing again", async () => {
    updateDisplayName.mockResolvedValue({
      error: "Couldn't save your changes — please try again.",
    });
    const user = userEvent.setup();
    render(<AccountProfileForm initialDisplayName={NAME} email={EMAIL} />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Couldn't save your changes — please try again.");

    await user.type(screen.getByLabelText("Display name"), "!");

    expect(
      screen.queryByText("Couldn't save your changes — please try again."),
    ).not.toBeInTheDocument();
  });
});
