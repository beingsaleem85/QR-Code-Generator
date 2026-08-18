// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QRDesignPanel } from "@/components/qr/QRDesignPanel";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";
import type { DesignConfig } from "@/types/qr-design";

afterEach(() => cleanup());

/** Mirrors how QRGeneratorShell actually wires QRDesignPanel — controlled, not a passthrough mock. */
function StatefulPanel({
  initial,
  onChange,
}: {
  initial: DesignConfig;
  onChange: (value: DesignConfig) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <QRDesignPanel
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

// jsdom implements FileReader for local Blobs, but not real image decoding
// or a canvas 2D context — only those two are mocked.
beforeEach(() => {
  class MockImage {
    width = 64;
    height = 64;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_value: string) {
      queueMicrotask(() => this.onload?.());
    }
  }
  vi.stubGlobal("Image", MockImage);

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,LOGO");
});

describe("QRDesignPanel logo upload", () => {
  it("uploads a file and shows a preview + remove action", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<StatefulPanel initial={DEFAULT_DESIGN_CONFIG} onChange={onChange} />);

    const file = new File(["fake-image-bytes"], "logo.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Logo"), file);

    expect(await screen.findByAltText("Logo preview")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        logo: expect.objectContaining({ assetUrl: "data:image/png;base64,LOGO" }),
      }),
    );
  });

  it("clears the logo when Remove logo is clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const withLogo = {
      ...DEFAULT_DESIGN_CONFIG,
      logo: { ...DEFAULT_DESIGN_CONFIG.logo, assetUrl: "data:image/png;base64,LOGO" },
    };
    render(<QRDesignPanel value={withLogo} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Remove logo" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ logo: expect.objectContaining({ assetUrl: null }) }),
    );
  });
});

describe("QRDesignPanel reset", () => {
  it("resets the whole design back to defaults", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const changed = {
      ...DEFAULT_DESIGN_CONFIG,
      colors: { ...DEFAULT_DESIGN_CONFIG.colors, foreground: "#ff0000" },
    };
    render(<QRDesignPanel value={changed} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Reset design" }));

    expect(onChange).toHaveBeenCalledWith(DEFAULT_DESIGN_CONFIG);
  });
});
