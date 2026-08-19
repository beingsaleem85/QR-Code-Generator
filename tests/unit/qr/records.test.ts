import { describe, expect, it } from "vitest";
import {
  deriveDestinationSummary,
  toQrCodeRecord,
  toQrCodeSummary,
  type QrCodeDbRow,
} from "@/lib/qr/records";
import { buildQrPayload } from "@/lib/qr/render";
import { renderStyledQrSvg } from "@/lib/qr/styled-svg";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";

function makeRow(overrides: Partial<QrCodeDbRow> = {}): QrCodeDbRow {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    user_id: "22222222-2222-2222-2222-222222222222",
    folder_id: null,
    name: "Test QR",
    slug: null,
    public_token: null,
    mode: "static",
    qr_type: "url",
    status: "active",
    payload_data: { url: "https://example.com" },
    destination_url: null,
    design_config: DEFAULT_DESIGN_CONFIG as unknown as Record<string, unknown>,
    scan_count_cached: 0,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("toQrCodeRecord (DB row -> app-layer serialization)", () => {
  it("maps every snake_case field to its camelCase equivalent", () => {
    const record = toQrCodeRecord(makeRow());

    expect(record).toEqual({
      id: "11111111-1111-1111-1111-111111111111",
      name: "Test QR",
      slug: null,
      publicToken: null,
      mode: "static",
      qrType: "url",
      status: "active",
      payloadData: { url: "https://example.com" },
      designConfig: DEFAULT_DESIGN_CONFIG,
      destinationUrl: null,
      folderId: null,
      scanCount: 0,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-02T00:00:00.000Z",
    });
  });

  it("never includes user_id — ownership stays a server/RLS concern only", () => {
    const record = toQrCodeRecord(makeRow());
    expect(record).not.toHaveProperty("user_id");
    expect(record).not.toHaveProperty("userId");
  });

  it("round-trips a dynamic row's slug", () => {
    const record = toQrCodeRecord(makeRow({ mode: "dynamic", slug: "abc123xy" }));
    expect(record.mode).toBe("dynamic");
    expect(record.slug).toBe("abc123xy");
  });

  it("round-trips a PDF row's public_token", () => {
    const record = toQrCodeRecord(
      makeRow({ mode: "dynamic", qr_type: "pdf", public_token: "aBcDeFgHiJkLmNoP" }),
    );
    expect(record.publicToken).toBe("aBcDeFgHiJkLmNoP");
  });

  it("leaves public_token null when the row has none", () => {
    const record = toQrCodeRecord(makeRow());
    expect(record.publicToken).toBeNull();
  });
});

describe("deriveDestinationSummary", () => {
  it("summarizes each implemented type from its own payload fields", () => {
    expect(deriveDestinationSummary("url", { url: "https://example.com" })).toBe(
      "https://example.com",
    );
    expect(deriveDestinationSummary("email", { to: "a@b.com" })).toBe("a@b.com");
    expect(deriveDestinationSummary("phone", { phone: "+15551234567" })).toBe("+15551234567");
    expect(deriveDestinationSummary("wifi", { ssid: "Store-Guest" })).toBe("Network: Store-Guest");
    expect(
      deriveDestinationSummary("vcard", {
        firstName: "Ada",
        lastName: "Lovelace",
        company: "Analytical Engines",
      }),
    ).toBe("Ada Lovelace, Analytical Engines");
    expect(deriveDestinationSummary("event", { title: "Launch Party" })).toBe("Launch Party");
  });

  it("preserves Unicode in the summary", () => {
    expect(deriveDestinationSummary("wifi", { ssid: "Café Wi-Fi 日本語" })).toBe(
      "Network: Café Wi-Fi 日本語",
    );
  });

  it("falls back to an em dash for missing/empty fields", () => {
    expect(deriveDestinationSummary("url", {})).toBe("—");
    expect(deriveDestinationSummary("vcard", {})).toBe("—");
  });

  it("truncates very long free text", () => {
    const summary = deriveDestinationSummary("text", { text: "a".repeat(200) });
    expect(summary.length).toBeLessThanOrEqual(80);
    expect(summary.endsWith("…")).toBe(true);
  });
});

describe("toQrCodeSummary", () => {
  it("derives destinationSummary from the record's own payload", () => {
    const record = toQrCodeRecord(makeRow({ payload_data: { url: "https://example.com/x" } }));
    const summary = toQrCodeSummary(record);

    expect(summary.destinationSummary).toBe("https://example.com/x");
    expect(summary.id).toBe(record.id);
    expect(summary.name).toBe(record.name);
  });
});

describe("regenerating a saved QR from its stored config", () => {
  it("produces valid SVG from a record's payloadData + designConfig — never a stored image", async () => {
    const record = toQrCodeRecord(
      makeRow({
        payload_data: { ssid: "Café Wi-Fi 日本語", encryption: "nopass" },
        qr_type: "wifi",
      }),
    );

    const payload = buildQrPayload(record.qrType, record.payloadData);
    expect(payload).not.toBeNull();

    const { svg } = await renderStyledQrSvg(payload as string, record.designConfig);
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });

  it("returns null (not a crash) when a saved payload somehow fails validation", () => {
    const record = toQrCodeRecord(makeRow({ payload_data: {}, qr_type: "url" }));
    expect(buildQrPayload(record.qrType, record.payloadData)).toBeNull();
  });
});
