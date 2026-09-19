// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationForm } from "@/components/qr/content-forms/LocationForm";

afterEach(() => cleanup());

describe("LocationForm", () => {
  it("renders latitude, longitude, query, and format fields", () => {
    render(<LocationForm value={{}} onChange={vi.fn()} />);

    expect(screen.getByLabelText(/latitude/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/longitude/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location name or address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/format/i)).toBeInTheDocument();
  });

  it("populates initial values when provided", () => {
    render(
      <LocationForm
        value={{ latitude: 40.7128, longitude: -74.006, query: "New York City", format: "geo" }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/latitude/i)).toHaveValue(40.7128);
    expect(screen.getByLabelText(/longitude/i)).toHaveValue(-74.006);
    expect(screen.getByLabelText(/location name or address/i)).toHaveValue("New York City");
  });

  it("calls onChange when fields are typed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LocationForm value={{}} onChange={onChange} />);

    await user.type(screen.getByLabelText(/latitude/i), "37.77");
    expect(onChange).toHaveBeenCalled();
  });
});
