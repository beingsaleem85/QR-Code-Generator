// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Barcode2DForm } from "@/components/qr/content-forms/Barcode2DForm";

afterEach(() => cleanup());

describe("Barcode2DForm", () => {
  it("renders data textarea and encoding standard select", () => {
    render(<Barcode2DForm value={{}} onChange={vi.fn()} />);

    expect(screen.getByLabelText(/barcode content/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/encoding standard/i)).toBeInTheDocument();
  });

  it("populates initial values when provided", () => {
    render(
      <Barcode2DForm
        value={{ data: "SN-987654321", encoding: "gs1" }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/barcode content/i)).toHaveValue("SN-987654321");
    expect(screen.getByLabelText(/encoding standard/i)).toHaveValue("gs1");
  });

  it("calls onChange when typing into data textarea", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Barcode2DForm value={{}} onChange={onChange} />);

    await user.type(screen.getByLabelText(/barcode content/i), "DATA-123");
    expect(onChange).toHaveBeenCalled();
  });
});
