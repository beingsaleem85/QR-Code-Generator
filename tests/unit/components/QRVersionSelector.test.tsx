// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QRVersionSelector } from "@/components/qr/QRVersionSelector";

afterEach(() => cleanup());

describe("QRVersionSelector", () => {
  it("renders the QR Version group with Auto, Version 10, Version 25, and Version 40", () => {
    render(<QRVersionSelector value="auto" onChange={vi.fn()} />);

    expect(screen.getByText("QR Version")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Auto" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Version 10" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Version 25" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Version 40" })).toBeInTheDocument();

    expect(screen.getByRole("radio", { name: "Auto" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Automatically selects the required version.")).toBeInTheDocument();
  });

  it("calls onChange when a version button is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QRVersionSelector value="auto" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: "Version 10" }));
    expect(onChange).toHaveBeenCalledWith(10);

    await user.click(screen.getByRole("radio", { name: "Version 25" }));
    expect(onChange).toHaveBeenCalledWith(25);

    await user.click(screen.getByRole("radio", { name: "Version 40" }));
    expect(onChange).toHaveBeenCalledWith(40);
  });

  it("displays correct module size hint for Version 10, 25, and 40", () => {
    const { rerender } = render(<QRVersionSelector value={10} onChange={vi.fn()} />);
    expect(screen.getByText("57 × 57 modules")).toBeInTheDocument();

    rerender(<QRVersionSelector value={25} onChange={vi.fn()} />);
    expect(screen.getByText("117 × 117 modules")).toBeInTheDocument();

    rerender(<QRVersionSelector value={40} onChange={vi.fn()} />);
    expect(screen.getByText("177 × 177 modules")).toBeInTheDocument();
  });
});
