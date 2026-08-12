// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QRGeneratorShell } from "@/components/qr/QRGeneratorShell";

afterEach(() => cleanup());

describe("QRGeneratorShell", () => {
  it("renders the URL content form by default", () => {
    render(<QRGeneratorShell />);
    expect(screen.getByText("URL / Link details")).toBeInTheDocument();
  });

  it("switches the content form when a different type is selected", async () => {
    const user = userEvent.setup();
    render(<QRGeneratorShell />);

    await user.click(screen.getByRole("option", { name: "Text" }));

    expect(screen.getByText("Text details")).toBeInTheDocument();
  });

  it("filters the type list when switching to dynamic mode", async () => {
    const user = userEvent.setup();
    render(<QRGeneratorShell />);

    const staticCount = screen.getAllByRole("option").length;
    await user.click(screen.getByRole("tab", { name: "dynamic" }));
    const dynamicCount = screen.getAllByRole("option").length;

    expect(dynamicCount).toBeLessThan(staticCount);
  });

  it("clears the name field when Reset is clicked", async () => {
    const user = userEvent.setup();
    render(<QRGeneratorShell />);

    const nameInput = screen.getByLabelText("QR name");
    await user.type(nameInput, "My QR");
    expect(nameInput).toHaveValue("My QR");

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(nameInput).toHaveValue("");
  });

  it("validates the URL field and shows an inline error on blur", async () => {
    const user = userEvent.setup();
    render(<QRGeneratorShell />);

    const urlInput = screen.getByLabelText("Destination URL");
    await user.click(urlInput);
    await user.tab();

    expect(await screen.findByText(/enter a url/i)).toBeInTheDocument();
  });
});
