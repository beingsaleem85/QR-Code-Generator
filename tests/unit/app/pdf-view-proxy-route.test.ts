import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const resolvePublicToken = vi.fn();
const createSignedAssetUrl = vi.fn();

vi.mock("@/server/services/public-token-resolution", () => ({ resolvePublicToken }));
vi.mock("@/lib/qr/signed-asset-url", () => ({ createSignedAssetUrl }));

function makeParams(token: string) {
  return { params: Promise.resolve({ token }) };
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

describe("GET /api/pdf-view/[token]", () => {
  it("streams the PDF through with the correct headers for an active PDF QR", async () => {
    resolvePublicToken.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf" },
      slug: "abc12345",
    });
    createSignedAssetUrl.mockResolvedValue("https://storage.example/signed?token=abc");
    fetchMock.mockResolvedValue(
      makeUpstreamResponse({ headers: { "content-length": "1234", "accept-ranges": "bytes" } }),
    );
    const { GET } = await import("@/app/api/pdf-view/[token]/route");

    const res = await GET(
      new Request("http://localhost/api/pdf-view/aBcDeFgHiJkLmNoP"),
      makeParams("aBcDeFgHiJkLmNoP"),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-length")).toBe("1234");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://storage.example/signed?token=abc",
      expect.objectContaining({ headers: undefined }),
    );
  });

  it("forwards a Range request header and passes through a 206", async () => {
    resolvePublicToken.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf" },
      slug: "abc12345",
    });
    createSignedAssetUrl.mockResolvedValue("https://storage.example/signed?token=abc");
    fetchMock.mockResolvedValue(
      makeUpstreamResponse({ status: 206, headers: { "content-range": "bytes 0-99/1234" } }),
    );
    const { GET } = await import("@/app/api/pdf-view/[token]/route");

    const request = new Request("http://localhost/api/pdf-view/aBcDeFgHiJkLmNoP", {
      headers: { range: "bytes=0-99" },
    });
    const res = await GET(request, makeParams("aBcDeFgHiJkLmNoP"));

    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe("bytes 0-99/1234");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://storage.example/signed?token=abc",
      expect.objectContaining({ headers: { range: "bytes=0-99" } }),
    );
  });

  it("returns 404 for an unknown token", async () => {
    resolvePublicToken.mockResolvedValue({ status: "not_found" });
    const { GET } = await import("@/app/api/pdf-view/[token]/route");

    const res = await GET(new Request("http://localhost/api/pdf-view/nope"), makeParams("nope"));

    expect(res.status).toBe(404);
    expect(createSignedAssetUrl).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 404 for a paused/archived QR — status enforced independently of the page", async () => {
    resolvePublicToken.mockResolvedValue({ status: "inactive" });
    const { GET } = await import("@/app/api/pdf-view/[token]/route");

    const res = await GET(
      new Request("http://localhost/api/pdf-view/aBcDeFgHiJkLmNoP"),
      makeParams("aBcDeFgHiJkLmNoP"),
    );

    expect(res.status).toBe(404);
    expect(createSignedAssetUrl).not.toHaveBeenCalled();
  });

  it("returns 404 for a token resolving to a non-PDF QR type — rejects cross-type access", async () => {
    resolvePublicToken.mockResolvedValue({
      status: "ok",
      qrType: "images",
      payloadData: {},
      slug: "abc12345",
    });
    const { GET } = await import("@/app/api/pdf-view/[token]/route");

    const res = await GET(
      new Request("http://localhost/api/pdf-view/aBcDeFgHiJkLmNoP"),
      makeParams("aBcDeFgHiJkLmNoP"),
    );

    expect(res.status).toBe(404);
    expect(createSignedAssetUrl).not.toHaveBeenCalled();
  });

  it("returns 404 when the PDF QR has no uploaded asset yet", async () => {
    resolvePublicToken.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: {},
      slug: "abc12345",
    });
    const { GET } = await import("@/app/api/pdf-view/[token]/route");

    const res = await GET(
      new Request("http://localhost/api/pdf-view/aBcDeFgHiJkLmNoP"),
      makeParams("aBcDeFgHiJkLmNoP"),
    );

    expect(res.status).toBe(404);
  });

  it("returns 404 when signing fails", async () => {
    resolvePublicToken.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf" },
      slug: "abc12345",
    });
    createSignedAssetUrl.mockResolvedValue(null);
    const { GET } = await import("@/app/api/pdf-view/[token]/route");

    const res = await GET(
      new Request("http://localhost/api/pdf-view/aBcDeFgHiJkLmNoP"),
      makeParams("aBcDeFgHiJkLmNoP"),
    );

    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never exposes the signed URL, a bucket path, the internal slug, or any secret in the response headers", async () => {
    resolvePublicToken.mockResolvedValue({
      status: "ok",
      qrType: "pdf",
      payloadData: { path: "u/a/menu.pdf" },
      slug: "abc12345",
    });
    createSignedAssetUrl.mockResolvedValue("https://storage.example/signed?token=super-secret");
    fetchMock.mockResolvedValue(makeUpstreamResponse({}));
    const { GET } = await import("@/app/api/pdf-view/[token]/route");

    const res = await GET(
      new Request("http://localhost/api/pdf-view/aBcDeFgHiJkLmNoP"),
      makeParams("aBcDeFgHiJkLmNoP"),
    );

    const allHeaderValues = [...res.headers.values()].join(" ");
    expect(allHeaderValues).not.toContain("super-secret");
    expect(allHeaderValues).not.toContain("storage.example");
    expect(allHeaderValues).not.toContain("u/a/menu.pdf");
    expect(allHeaderValues).not.toContain("abc12345");
  });
});
