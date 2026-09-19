import { describe, expect, it, vi } from "vitest";
import { resolveLandingPage } from "@/server/services/landing-page-resolution";
import { streamPdfFromPath } from "@/lib/qr/pdf-proxy-stream";

vi.mock("@/server/services/landing-page-resolution", () => ({
  resolveLandingPage: vi.fn(),
}));

vi.mock("@/lib/qr/pdf-proxy-stream", () => ({
  streamPdfFromPath: vi.fn(
    (path: string, range: string | null, fileName: string) =>
      new Response("PDF bytes", {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${fileName}"`,
        },
      }),
  ),
}));

describe("PDF public metadata & filename privacy", () => {
  it("never exposes private local disk filename to public proxy route when publicTitle is unset", async () => {
    vi.mocked(resolveLandingPage).mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: {
        path: "users/123/asset-456/private_file.pdf",
        fileName: "Super_Secret_Personal_Medical_Report_2026.pdf",
      },
    });

    const { GET } = await import("@/app/api/public-pdf/[slug]/route");
    const response = await GET(
      new Request("https://qrforge.space/api/public-pdf/my-slug"),
      { params: Promise.resolve({ slug: "my-slug" }) },
    );

    expect(response.status).toBe(200);
    expect(streamPdfFromPath).toHaveBeenCalledWith(
      "users/123/asset-456/private_file.pdf",
      null,
      "document.pdf",
    );
    expect(response.headers.get("Content-Disposition")).not.toContain("Super_Secret");
    expect(response.headers.get("Content-Disposition")).toContain("document.pdf");
  });

  it("uses sanitized public title when creator designates a publicTitle", async () => {
    vi.mocked(resolveLandingPage).mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: {
        path: "users/123/asset-456/file.pdf",
        fileName: "Internal_Draft_v1.pdf",
        publicTitle: "Company Annual Report",
      },
    });

    const { GET } = await import("@/app/api/public-pdf/[slug]/route");
    const response = await GET(
      new Request("https://qrforge.space/api/public-pdf/annual-report"),
      { params: Promise.resolve({ slug: "annual-report" }) },
    );

    expect(response.status).toBe(200);
    expect(streamPdfFromPath).toHaveBeenCalledWith(
      "users/123/asset-456/file.pdf",
      null,
      "Company Annual Report.pdf",
    );
    expect(response.headers.get("Content-Disposition")).toContain("Company Annual Report.pdf");
    expect(response.headers.get("Content-Disposition")).not.toContain("Internal_Draft");
  });
});
