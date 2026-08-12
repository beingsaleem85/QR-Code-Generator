// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountProfileForm } from "@/components/account/AccountProfileForm";

afterEach(() => cleanup());

describe("AccountProfileForm", () => {
  it("pre-fills the display name and shows a read-only email", () => {
    render(<AccountProfileForm initialDisplayName="Ada Lovelace" email="ada@example.com" />);

    expect(screen.getByLabelText("Display name")).toHaveValue("Ada Lovelace");
    expect(screen.getByLabelText("Email")).toHaveValue("ada@example.com");
    expect(screen.getByLabelText("Email")).toBeDisabled();
  });

  it("shows a validation error when the display name is cleared", async () => {
    const user = userEvent.setup();
    render(<AccountProfileForm initialDisplayName="Ada Lovelace" email="ada@example.com" />);

    await user.clear(screen.getByLabelText("Display name"));
    await user.tab();

    expect(await screen.findByText("Enter a display name")).toBeInTheDocument();
  });

  it("enters a loading state on submit and shows the not-connected note", async () => {
    const user = userEvent.setup();
    render(<AccountProfileForm initialDisplayName="Ada Lovelace" email="ada@example.com" />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
  });
});
