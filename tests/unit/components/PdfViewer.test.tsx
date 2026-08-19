// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

class ResponseExceptionMock extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const getDocument = vi.fn();

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument,
  ResponseException: ResponseExceptionMock,
}));

class FakeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function makeMockPage(width = 600, height = 800) {
  return {
    getViewport: ({ scale }: { scale: number }) => ({
      width: width * scale,
      height: height * scale,
    }),
    render: () => ({ promise: Promise.resolve(), cancel: vi.fn() }),
  };
}

function makeMockDoc(numPages: number) {
  return {
    numPages,
    getPage: vi.fn(async () => makeMockPage()),
  };
}

function mockGetDocumentResolves(numPages: number) {
  getDocument.mockReturnValue({
    promise: Promise.resolve(makeMockDoc(numPages)),
    destroy: vi.fn(),
  });
}

function mockGetDocumentRejects(error: unknown) {
  getDocument.mockReturnValue({
    promise: Promise.reject(error),
    destroy: vi.fn(),
  });
}

let lastAnchor: HTMLAnchorElement | null = null;

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  vi.stubGlobal("ResizeObserver", FakeObserver);
  URL.createObjectURL = vi.fn(() => "blob:mock-url");
  URL.revokeObjectURL = vi.fn();
  lastAnchor = null;
  const realCreateElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    const el = realCreateElement(tag);
    if (tag === "a") lastAnchor = el as HTMLAnchorElement;
    return el;
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  getDocument.mockReset();
});

async function renderReady(numPages = 1) {
  mockGetDocumentResolves(numPages);
  const { PdfViewer } = await import("@/components/landing/pdf-viewer/PdfViewer");
  render(<PdfViewer slug="abc12345" fileName="offer letter.pdf" />);
  await screen.findByText(`1 / ${numPages}`);
}

describe("PdfViewer — loading and rendering", () => {
  it("shows a loading state before the document resolves", async () => {
    let resolveDoc!: (doc: unknown) => void;
    getDocument.mockReturnValue({
      promise: new Promise((resolve) => {
        resolveDoc = resolve;
      }),
      destroy: vi.fn(),
    });
    const { PdfViewer } = await import("@/components/landing/pdf-viewer/PdfViewer");
    render(<PdfViewer slug="abc12345" fileName="offer.pdf" />);

    expect(screen.getByText("Loading document…")).toBeInTheDocument();
    resolveDoc(makeMockDoc(1));
    await screen.findByText("1 / 1");
  });

  it("shows the sanitized filename in the header once ready", async () => {
    mockGetDocumentResolves(1);
    const { PdfViewer } = await import("@/components/landing/pdf-viewer/PdfViewer");
    render(<PdfViewer slug="abc12345" fileName="employment offer letter" />);

    await screen.findByText("employment offer letter.pdf");
  });

  it("shows the correct page count for a multi-page PDF", async () => {
    await renderReady(4);
    expect(screen.getByText("1 / 4")).toBeInTheDocument();
  });

  it("fetches the document from the same-origin proxy URL, never a Supabase URL", async () => {
    await renderReady(1);
    expect(getDocument).toHaveBeenCalledWith({ url: "/api/public-pdf/abc12345" });
  });
});

describe("PdfViewer — zoom", () => {
  it("zoom in and zoom out change the displayed percentage", async () => {
    const user = userEvent.setup();
    await renderReady(1);

    expect(screen.getByText("100%")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByText("125%")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("fit width resets zoom back to 100%", async () => {
    const user = userEvent.setup();
    await renderReady(1);

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByText("150%")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("button", { name: /fit width/i }));
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});

describe("PdfViewer — download", () => {
  it("downloads the PDF with a clean, sanitized filename", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["pdf"]) }),
    );
    const user = userEvent.setup();
    await renderReady(1);

    await user.click(screen.getByRole("button", { name: /download/i }));

    await waitFor(() => expect(lastAnchor).not.toBeNull());
    expect(lastAnchor?.download).toBe("offer letter.pdf");
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it("shows an error message if the download fetch fails, without crashing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const user = userEvent.setup();
    await renderReady(1);

    await user.click(screen.getByRole("button", { name: /download/i }));

    await screen.findByText(/couldn't download this file/i);
  });
});

describe("PdfViewer — share", () => {
  it("shares the actual PDF file when the browser supports file sharing", async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    const canShareMock = vi.fn().mockReturnValue(true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["pdf"]) }),
    );
    Object.defineProperty(navigator, "share", { value: shareMock, configurable: true });
    Object.defineProperty(navigator, "canShare", { value: canShareMock, configurable: true });
    const user = userEvent.setup();
    await renderReady(1);

    await user.click(screen.getByRole("button", { name: /^share$/i }));

    await waitFor(() => expect(shareMock).toHaveBeenCalled());
    const call = shareMock.mock.calls[0][0];
    expect(call.files).toHaveLength(1);
    expect(call.files[0].name).toBe("offer letter.pdf");
    expect(call.files[0].type).toBe("application/pdf");
  });

  it("falls back to sharing the stable viewer link when file sharing isn't supported", async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["pdf"]) }),
    );
    Object.defineProperty(navigator, "share", { value: shareMock, configurable: true });
    Object.defineProperty(navigator, "canShare", { value: undefined, configurable: true });
    const user = userEvent.setup();
    await renderReady(1);

    await user.click(screen.getByRole("button", { name: /^share$/i }));

    await waitFor(() => expect(shareMock).toHaveBeenCalled());
    const call = shareMock.mock.calls[0][0];
    expect(call.url).toBe(window.location.href);
    expect(call.files).toBeUndefined();
  });

  it("falls back to copying the link when no share API is available at all", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["pdf"]) }),
    );
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    Object.defineProperty(navigator, "canShare", { value: undefined, configurable: true });
    // `userEvent.setup()` installs its own clipboard stub (which genuinely
    // implements `writeText`), overriding anything defined before it — so
    // this asserts the fallback's visible outcome rather than a mock call,
    // which is both simpler and unaffected by that stub's internals.
    const user = userEvent.setup();
    await renderReady(1);

    await user.click(screen.getByRole("button", { name: /^share$/i }));

    await screen.findByText(/link copied/i);
  });
});

describe("PdfViewer — error states", () => {
  it("shows a 'no longer available' message when the proxy returns 404", async () => {
    mockGetDocumentRejects(new ResponseExceptionMock("not found", 404));
    const { PdfViewer } = await import("@/components/landing/pdf-viewer/PdfViewer");
    render(<PdfViewer slug="abc12345" fileName="offer.pdf" />);

    await screen.findByText(/no longer available/i);
  });

  it("shows a generic load-failure message with a working Try again for other failures", async () => {
    mockGetDocumentRejects(new Error("boom"));
    const { PdfViewer } = await import("@/components/landing/pdf-viewer/PdfViewer");
    render(<PdfViewer slug="abc12345" fileName="offer.pdf" />);

    await screen.findByText(/couldn't open this pdf/i);

    mockGetDocumentResolves(1);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /try again/i }));

    await screen.findByText("1 / 1");
  });

  it("never shows raw error details, bucket names, or signed URLs in the error state", async () => {
    mockGetDocumentRejects(
      new Error("Storage error: bucket qr-documents, signed URL https://x.supabase.co/token=abc"),
    );
    const { PdfViewer } = await import("@/components/landing/pdf-viewer/PdfViewer");
    render(<PdfViewer slug="abc12345" fileName="offer.pdf" />);

    await screen.findByText(/couldn't open this pdf/i);
    expect(screen.queryByText(/supabase/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bucket/i)).not.toBeInTheDocument();
  });
});
