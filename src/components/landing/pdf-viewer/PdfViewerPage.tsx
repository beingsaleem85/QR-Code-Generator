"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

interface PdfViewerPageProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  eager: boolean;
  registerRef: (pageNumber: number, el: HTMLDivElement | null) => void;
}

/**
 * Renders one page as a canvas, lazily: nothing is drawn until this page's
 * wrapper actually intersects the viewport (with a generous preload margin
 * so scrolling stays smooth) or `eager` says to render immediately (used
 * for the first couple of pages, so the initial paint isn't empty). This
 * avoids rendering every page of a large PDF up front — the outer
 * `PdfViewer` also uses each wrapper's intersection to track which page is
 * "current", so this component reports intersection but doesn't decide
 * what to do with it beyond its own render trigger.
 */
export function PdfViewerPage({ pdf, pageNumber, scale, eager, registerRef }: PdfViewerPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(eager);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    registerRef(pageNumber, el);
    return () => registerRef(pageNumber, null);
  }, [pageNumber, registerRef]);

  useEffect(() => {
    if (shouldRender) return;
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setShouldRender(true);
      },
      { rootMargin: "1000px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldRender]);

  useEffect(() => {
    if (!shouldRender) return;
    let cancelled = false;
    let renderTask: RenderTask | null = null;

    (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;

      const outputScale = typeof window !== "undefined" ? (window.devicePixelRatio ?? 1) : 1;
      canvas.width = Math.max(1, Math.floor(viewport.width * outputScale));
      canvas.height = Math.max(1, Math.floor(viewport.height * outputScale));
      setSize({ width: viewport.width, height: viewport.height });

      renderTask = page.render({
        canvas,
        viewport,
        transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
      });
      try {
        await renderTask.promise;
      } catch {
        // A cancelled or superseded render (e.g. zoom changed mid-render) —
        // the effect's own cleanup already handles that; nothing to show.
      }
    })();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, scale, shouldRender]);

  return (
    <div
      ref={wrapperRef}
      data-page-number={pageNumber}
      className="flex justify-center py-2"
      style={!shouldRender ? { minHeight: 200 } : undefined}
    >
      {shouldRender ? (
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Page ${pageNumber}`}
          style={size ? { width: size.width, height: size.height } : undefined}
          className="max-w-full rounded-sm shadow-sm"
        />
      ) : null}
    </div>
  );
}
