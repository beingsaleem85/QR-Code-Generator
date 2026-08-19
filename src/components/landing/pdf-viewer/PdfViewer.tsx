"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  MoreVertical,
  Share2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  clampZoomPercent,
  sanitizePdfFileName,
  ZOOM_MAX_PERCENT,
  ZOOM_MIN_PERCENT,
  ZOOM_STEP_PERCENT,
} from "@/lib/qr/pdf-viewer-utils";
import { PdfViewerPage } from "./PdfViewerPage";

interface PdfViewerProps {
  /** The same-origin PDF proxy URL to load from — `/api/public-pdf/[slug]`
   * or `/api/pdf-view/[token]`, built by the caller. This component never
   * needs to know which kind of public identifier resolved it, only where
   * to fetch bytes from — never a Supabase Storage URL directly, so the
   * visible browser URL never leaves whichever public route rendered it. */
  proxyUrl: string;
  fileName: string;
}

type ViewerState = "loading" | "ready" | "missing" | "error";

const EAGER_PAGE_COUNT = 2;

/**
 * Full-screen, application-hosted PDF viewer for a scan-time direct-open
 * QR. Renders pages to canvas via `pdfjs-dist`, loaded dynamically inside
 * an effect (never at module scope) so it's never evaluated during
 * server-side rendering, only after this client component has actually
 * mounted in a browser.
 */
export function PdfViewer({ proxyUrl, fileName }: PdfViewerProps) {
  const displayName = sanitizePdfFileName(fileName);

  const [state, setState] = useState<ViewerState>("loading");
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [baseWidth, setBaseWidth] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [containerWidth, setContainerWidth] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef(new Map<number, HTMLDivElement>());
  const ratiosRef = useRef(new Map<number, number>());

  useEffect(() => {
    // `window.history` only exists client-side, so this one-time read
    // can't happen during the render that has to match server output — an
    // effect is the correct, standard way to defer it (same pattern as
    // `NewQrCodePage`'s draft restore), not a case the "avoid setState-in-
    // effect" rule's cascading-render concern applies to.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanGoBack(typeof window !== "undefined" && window.history.length > 1);
  }, []);

  // Loads the document. `reloadToken` lets the error state's "Try again"
  // re-run this without duplicating the loading logic. Resetting state at
  // the top of the effect (rather than in render) is intentional: this
  // effect's own async work is what determines the next state, so there's
  // no synchronous alternative that avoids the effect entirely.
  useEffect(() => {
    let cancelled = false;
    let loadingTask: ReturnType<typeof import("pdfjs-dist").getDocument> | null = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState("loading");
    setPdf(null);
    setNumPages(0);
    setBaseWidth(null);
    setCurrentPage(1);

    (async () => {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();

      loadingTask = pdfjsLib.getDocument({ url: proxyUrl });

      try {
        const doc = await loadingTask.promise;
        if (cancelled) return;
        const firstPage = await doc.getPage(1);
        if (cancelled) return;
        const viewport = firstPage.getViewport({ scale: 1 });
        setPdf(doc);
        setNumPages(doc.numPages);
        setBaseWidth(viewport.width);
        setState("ready");
      } catch (err) {
        if (cancelled) return;
        // The proxy returns 404 for a missing/never-uploaded asset (and for
        // a paused/archived QR, though that shouldn't normally be reachable
        // here — the page above this already gates on active status). Any
        // other failure (network error, corrupt PDF) is a generic load
        // failure with a retry, not "this file doesn't exist".
        const isMissing = err instanceof pdfjsLib.ResponseException && err.status === 404;
        setState(isMissing ? "missing" : "error");
      }
    })();

    return () => {
      cancelled = true;
      void loadingTask?.destroy();
    };
  }, [proxyUrl, reloadToken]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const registerRef = useCallback((pageNumber: number, el: HTMLDivElement | null) => {
    if (el) pageRefs.current.set(pageNumber, el);
    else pageRefs.current.delete(pageNumber);
  }, []);

  // Tracks which page is "current" for the page-indicator/prev-next
  // controls — the page whose wrapper has the greatest visible intersection
  // ratio right now, out of every page wrapper this observer watches.
  useEffect(() => {
    if (!numPages || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const pageNumber = Number((entry.target as HTMLElement).dataset.pageNumber);
          if (!Number.isNaN(pageNumber)) ratiosRef.current.set(pageNumber, entry.intersectionRatio);
        }
        let bestPage: number | null = null;
        let bestRatio = 0;
        for (const [pageNumber, ratio] of ratiosRef.current) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestPage = pageNumber;
          }
        }
        if (bestPage !== null) setCurrentPage(bestPage);
      },
      { root: scrollRef.current, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    for (const el of pageRefs.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [numPages]);

  const fitWidthScale = baseWidth && containerWidth ? containerWidth / baseWidth : 1;
  const effectiveScale = fitWidthScale * (zoomPercent / 100);

  const goToPage = useCallback(
    (target: number) => {
      const clamped = Math.max(1, Math.min(numPages, target));
      pageRefs.current.get(clamped)?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [numPages],
  );

  const handleDownload = useCallback(async () => {
    setDownloadError(null);
    try {
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("download failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = displayName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setDownloadError("We couldn't download this file. Try again.");
    }
  }, [proxyUrl, displayName]);

  const handleShare = useCallback(async () => {
    setShareMessage(null);

    let file: File | null = null;
    try {
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const blob = await res.blob();
        file = new File([blob], displayName, { type: "application/pdf" });
      }
    } catch {
      file = null;
    }

    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: displayName });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    // Fallback: the file couldn't be shared directly (unsupported browser,
    // or the fetch above failed) — share or copy the stable viewer link
    // instead. Never fail silently either way.
    const viewerUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url: viewerUrl, title: displayName });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(viewerUrl);
      setShareMessage("Link copied");
    } catch {
      setShareMessage("Couldn't copy the link — copy it from the address bar.");
    }
  }, [proxyUrl, displayName]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-1 border-b border-border px-1">
        {canGoBack ? (
          <button
            type="button"
            aria-label="Back"
            onClick={() => window.history.back()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-surface"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : null}
        <p className="min-w-0 flex-1 truncate px-2 text-sm font-medium text-foreground">
          {displayName}
        </p>
        <div className="relative shrink-0">
          <button
            type="button"
            aria-label="More"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-11 z-10 w-40 rounded-lg border border-border bg-surface py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setZoomPercent(100);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-background"
              >
                <Maximize2 className="h-4 w-4" /> Fit width
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
        {state === "loading" ? (
          <div className="flex h-full min-h-[50vh] items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading document…</p>
          </div>
        ) : null}

        {state === "missing" ? (
          <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-sm font-medium text-foreground">
              This document is no longer available.
            </p>
          </div>
        ) : null}

        {state === "error" ? (
          <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm font-medium text-foreground">We couldn&apos;t open this PDF.</p>
            <Button size="sm" onClick={() => setReloadToken((token) => token + 1)}>
              Try again
            </Button>
          </div>
        ) : null}

        {state === "ready" && pdf ? (
          <div className="flex flex-col items-center px-2 pb-4">
            {Array.from({ length: numPages }, (_, index) => index + 1).map((pageNumber) => (
              <PdfViewerPage
                key={pageNumber}
                pdf={pdf}
                pageNumber={pageNumber}
                scale={effectiveScale}
                eager={pageNumber <= EAGER_PAGE_COUNT}
                registerRef={registerRef}
              />
            ))}
          </div>
        ) : null}
      </div>

      {state === "ready" ? (
        <footer className="flex shrink-0 flex-col gap-1 border-t border-border bg-surface px-2 py-2">
          {downloadError ? (
            <p className="text-center text-xs text-destructive">{downloadError}</p>
          ) : null}
          {shareMessage ? (
            <p className="text-center text-xs text-muted-foreground">{shareMessage}</p>
          ) : null}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous page"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-background disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="min-w-[3.5rem] text-center text-xs text-muted-foreground">
                {currentPage} / {numPages}
              </span>
              <button
                type="button"
                aria-label="Next page"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= numPages}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-background disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => setZoomPercent((z) => clampZoomPercent(z - ZOOM_STEP_PERCENT))}
                disabled={zoomPercent <= ZOOM_MIN_PERCENT}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-background disabled:opacity-30"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
                {Math.round(zoomPercent)}%
              </span>
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => setZoomPercent((z) => clampZoomPercent(z + ZOOM_STEP_PERCENT))}
                disabled={zoomPercent >= ZOOM_MAX_PERCENT}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-background disabled:opacity-30"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleShare}
                className="flex h-9 items-center gap-1 rounded-full px-2 text-xs font-medium text-foreground hover:bg-background"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex h-9 items-center gap-1 rounded-full px-2 text-xs font-medium text-foreground hover:bg-background"
              >
                <Download className="h-4 w-4" /> Download
              </button>
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
