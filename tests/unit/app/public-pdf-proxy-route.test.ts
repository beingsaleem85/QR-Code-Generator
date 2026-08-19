import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const resolveLandingPage = vi.fn();
const createSignedAssetUrl = vi.fn();

vi.mock("@/server/services/landing-page-resolution", () => ({ resolveLandingPage }));
vi.mock("@/lib/qr/signed-asset-url", () => ({ createSignedAssetUrl }));

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

function makeUpstreamResponse(init: {
  status?: number;
  ok?: boolean;
  headers?: Record<string, string>;
  body?: string;
}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    body: init.body ?? "pdf-bytes",
    headers: {
      get: (name: string) => init.headers?.[name.toLowerCase()] ?? null,
    },
  };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("GET /api/public-pdf/[slug]", () => {
  it("streams the PDF through with the correct headers for an active PDF QR", async () => {
    resolveLandingPage.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf" },
    });
    createSignedAssetUrl.mockResolvedValue("https://storage.example/signed?token=abc");
    fetchMock.mockResolvedValue(
      makeUpstreamResponse({
        headers: { "content-length": "1234", "accept-ranges": "bytes" },
      }),
    );
    const { GET } = await import("@/app/api/public-pdf/[slug]/route");

    const res = await GET(
      new Request("http://localhost/api/public-pdf/abc12345"),
      makeParams("abc12345"),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-length")).toBe("1234");
    expect(res.headers.get("accept-ranges")).toBe("bytes");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://storage.example/signed?token=abc",
      expect.objectContaining({ headers: undefined }),
    );
  });

  it("forwards a Range request header to the upstream signed URL and passes through a 206", async () => {
    resolveLandingPage.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf" },
    });
    createSignedAssetUrl.mockResolvedValue("https://storage.example/signed?token=abc");
    fetchMock.mockResolvedValue(
      makeUpstreamResponse({
        status: 206,
        headers: { "content-range": "bytes 0-99/1234", "accept-ranges": "bytes" },
      }),
    );
    const { GET } = await import("@/app/api/public-pdf/[slug]/route");

    const request = new Request("http://localhost/api/public-pdf/abc12345", {
      headers: { range: "bytes=0-99" },
    });
    const res = await GET(request, makeParams("abc12345"));

    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe("bytes 0-99/1234");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://storage.example/signed?token=abc",
      expect.objectContaining({ headers: { range: "bytes=0-99" } }),
    );
  });

  it("returns 404 for an unknown slug", async () => {
    resolveLandingPage.mockResolvedValue({ status: "not_found" });
    const { GET } = await import("@/app/api/public-pdf/[slug]/route");

    const res = await GET(new Request("http://localhost/api/public-pdf/nope"), makeParams("nope"));

    expect(res.status).toBe(404);
    expect(createSignedAssetUrl).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 404 for a paused/archived QR — status must be enforced independently of the page", async () => {
    resolveLandingPage.mockResolvedValue({ status: "inactive" });
    const { GET } = await import("@/app/api/public-pdf/[slug]/route");

    const res = await GET(
      new Request("http://localhost/api/public-pdf/abc12345"),
      makeParams("abc12345"),
    );

    expect(res.status).toBe(404);
    expect(createSignedAssetUrl).not.toHaveBeenCalled();
  });

  it("returns 404 for a non-PDF QR type sharing the resolution path — rejects cross-type access", async () => {
    resolveLandingPage.mockResolvedValue({
      status: "ok",
      qrType: "images",
      payloadData: { images: [] },
    });
    const { GET } = await import("@/app/api/public-pdf/[slug]/route");

    const res = await GET(
      new Request("http://localhost/api/public-pdf/abc12345"),
      makeParams("abc12345"),
    );

    expect(res.status).toBe(404);
    expect(createSignedAssetUrl).not.toHaveBeenCalled();
  });

  it("returns 404 when the PDF QR has no uploaded asset yet", async () => {
    resolveLandingPage.mockResolvedValue({ status: "ok", qrType: "pdf", payloadData: {} });
    const { GET } = await import("@/app/api/public-pdf/[slug]/route");

    const res = await GET(
      new Request("http://localhost/api/public-pdf/abc12345"),
      makeParams("abc12345"),
    );

    expect(res.status).toBe(404);
    expect(createSignedAssetUrl).not.toHaveBeenCalled();
  });

  it("ignores a path supplied on payload_data that isn't a string — rejects malformed/injected input", async () => {
    resolveLandingPage.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: { $ne: null } },
    });
    const { GET } = await import("@/app/api/public-pdf/[slug]/route");

    const res = await GET(
      new Request("http://localhost/api/public-pdf/abc12345"),
      makeParams("abc12345"),
    );

    expect(res.status).toBe(404);
    expect(createSignedAssetUrl).not.toHaveBeenCalled();
  });

  it("returns 404 when signing fails (e.g. RLS rejects it)", async () => {
    resolveLandingPage.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf" },
    });
    createSignedAssetUrl.mockResolvedValue(null);
    const { GET } = await import("@/app/api/public-pdf/[slug]/route");

    const res = await GET(
      new Request("http://localhost/api/public-pdf/abc12345"),
      makeParams("abc12345"),
    );

    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the upstream fetch throws", async () => {
    resolveLandingPage.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf" },
    });
    createSignedAssetUrl.mockResolvedValue("https://storage.example/signed?token=abc");
    fetchMock.mockRejectedValue(new Error("network error"));
    const { GET } = await import("@/app/api/public-pdf/[slug]/route");

    const res = await GET(
      new Request("http://localhost/api/public-pdf/abc12345"),
      makeParams("abc12345"),
    );

    expect(res.status).toBe(404);
  });

  it("returns 404 when the upstream responds with a non-ok, non-206 status", async () => {
    resolveLandingPage.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf" },
    });
    createSignedAssetUrl.mockResolvedValue("https://storage.example/signed?token=abc");
    fetchMock.mockResolvedValue(makeUpstreamResponse({ ok: false, status: 403 }));
    const { GET } = await import("@/app/api/public-pdf/[slug]/route");

    const res = await GET(
      new Request("http://localhost/api/public-pdf/abc12345"),
      makeParams("abc12345"),
    );

    expect(res.status).toBe(404);
  });

  it("never exposes the signed URL, a bucket path, or any secret in the response headers", async () => {
    resolveLandingPage.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf" },
    });
    createSignedAssetUrl.mockResolvedValue("https://storage.example/signed?token=super-secret");
    fetchMock.mockResolvedValue(makeUpstreamResponse({}));
    const { GET } = await import("@/app/api/public-pdf/[slug]/route");

    const res = await GET(
      new Request("http://localhost/api/public-pdf/abc12345"),
      makeParams("abc12345"),
    );

    const allHeaderValues = [...res.headers.values()].join(" ");
    expect(allHeaderValues).not.toContain("super-secret");
    expect(allHeaderValues).not.toContain("storage.example");
    expect(allHeaderValues).not.toContain("u/a/menu.pdf");
  });
});
