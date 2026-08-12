// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";

afterEach(() => cleanup());

const LINKS = [
  { label: "Generator", href: "/qr-generator" },
  { label: "Pricing", href: "/pricing" },
];

describe("MobileNavDrawer", () => {
  it("is closed until the menu button is clicked", () => {
    render(<MobileNavDrawer links={LINKS} />);

    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("opens the drawer and shows every link plus the optional CTA", async () => {
    const user = userEvent.setup();
    render(
      <MobileNavDrawer links={LINKS} cta={{ label: "Create QR Code", href: "/qr-generator" }} />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("link", { name: "Generator" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pricing" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create QR Code" })).toBeInTheDocument();
  });

  it("closes when the close button is clicked", async () => {
    const user = userEvent.setup();
    render(<MobileNavDrawer links={LINKS} />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Close menu" }));

    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("closes when a nav link is clicked", async () => {
    const user = userEvent.setup();
    render(<MobileNavDrawer links={LINKS} />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("link", { name: "Generator" }));

    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
