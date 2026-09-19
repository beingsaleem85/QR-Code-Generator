// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UpgradeModal } from "@/components/account/UpgradeModal";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function mock(this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function mock(this: HTMLDialogElement) {
    this.open = false;
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("UpgradeModal", () => {
  it("renders with title, description, and action buttons when open", () => {
    render(<UpgradeModal open={true} onClose={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /your free trial has ended/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        /your 14-day qrforge free trial has expired\. upgrade to pro to create new qr codes and reactivate your dynamic qr codes\./i,
      ),
    ).toBeInTheDocument();

    const upgradeLink = screen.getByRole("link", { name: /upgrade to pro/i });
    expect(upgradeLink).toBeInTheDocument();
    expect(upgradeLink).toHaveAttribute("href", "/pricing");

    const maybeLaterBtn = screen.getByRole("button", { name: /maybe later/i });
    expect(maybeLaterBtn).toBeInTheDocument();
  });

  it("calls onClose when Maybe later is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<UpgradeModal open={true} onClose={onClose} />);

    const maybeLaterBtn = screen.getByRole("button", { name: /maybe later/i });
    await user.click(maybeLaterBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Upgrade to Pro is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<UpgradeModal open={true} onClose={onClose} />);

    const upgradeLink = screen.getByRole("link", { name: /upgrade to pro/i });
    await user.click(upgradeLink);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
