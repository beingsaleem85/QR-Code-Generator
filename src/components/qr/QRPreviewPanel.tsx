"use client";

import { useEffect, useState } from "react";
import { Lock, FileText, ExternalLink, Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { QrPlaceholderGraphic } from "@/components/ui/QrPlaceholderGraphic";
import { buildQrPayload, resolveEncodedPayload } from "@/lib/qr/render";
import { renderStyledQrSvg } from "@/lib/qr/styled-svg";
import { getLocalPdfBlobUrl } from "@/lib/qr/pdf-blob-cache";
import type { DesignConfig } from "@/types/qr-design";
import type { QRMode, QRType } from "@/types/qr";

interface QRPreviewPanelProps {
  qrType: QRType;
  mode: QRMode;
  content: Record<string, unknown>;
  design: DesignConfig;
  /** The saved record's slug (edit mode only) — a dynamic QR has no
   * scannable image until it's been saved once and issued one. */
  slug?: string | null;
  /** The saved record's opaque public-viewer token (edit mode only) — see
   * `resolveEncodedPayload`'s doc comment. */
  publicToken?: string | null;
  isAuthenticated?: boolean;
  isTrialExpired?: boolean;
  onGuestAction?: () => void;
  onTrialExpired?: () => void;
}

/** Debounces re-render on rapid input (typing, slider drag) — the Preview
 * Performance rule from Module 3.3. Form inputs stay responsive since this
 * only delays the (separate, async) render effect, never the input itself. */
const RENDER_DEBOUNCE_MS = 200;

interface RenderedState {
  payload: string;
  svg: string;
  warnings: string[];
}

/** Real, fully-styled QR rendering (Module 3.3) — pattern/eyes/gradient/logo/frame, not just solid colors. */
export function QRPreviewPanel({
  qrType,
  mode,
  content,
  design,
  slug,
  publicToken,
  isAuthenticated = true,
  isTrialExpired = false,
  onGuestAction,
  onTrialExpired,
}: QRPreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<"qr" | "destination">("qr");

  const isAuthorized = Boolean(isAuthenticated) && !isTrialExpired;

  const payload = resolveEncodedPayload(mode, qrType, content, slug, publicToken);
  // Content is valid (so Save will succeed) but a dynamic QR has no slug
  // yet — distinct from "nothing entered" so the empty state explains why.
  const pendingFirstSave = mode === "dynamic" && !slug && !!buildQrPayload(qrType, content);
  // Tracks which payload the rendered markup belongs to, so a stale SVG
  // never shows for the wrong content — checked at render time rather
  // than cleared with a synchronous setState inside the effect (the React
  // Compiler flags that as cascading-render-prone).
  const [rendered, setRendered] = useState<RenderedState | null>(null);

  useEffect(() => {
    // If not authorized (guest or expired trial), NEVER invoke the QR encoder
    // or process the user payload into an SVG/canvas/image.
    if (!payload || !isAuthorized) {
      return;
    }

    const timeoutId = setTimeout(() => {
      renderStyledQrSvg(payload, design, qrType).then(({ svg, warnings }) => {
        setRendered({ payload, svg, warnings });
      });
    }, RENDER_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
    // design is destructured per-slice so this only re-fires when a slice
    // that actually affects rendering changes, not on every design update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, payload, qrType, design.colors, design.pattern, design.eyes, design.logo, design.frame]);

  const current = isAuthorized && rendered?.payload === payload ? rendered : null;

  return (
    <Card className="rounded-2xl flex flex-col items-center gap-4 p-6">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-surface-raised p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("qr")}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              activeTab === "qr"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="QR Code preview"
          >
            QR Code
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("destination")}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              activeTab === "destination"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Destination preview"
          >
            Destination
          </button>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          Live
        </span>
      </div>

      {activeTab === "qr" ? (
        <>
          <div className="relative flex aspect-square w-full max-w-[240px] items-center justify-center">
            <div aria-hidden="true" className="absolute inset-4 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-border bg-background p-4 shadow-lg overflow-hidden">
              {!isAuthorized ? (
                <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center">
                  <div className="relative mb-2 flex items-center justify-center">
                    <QrPlaceholderGraphic size={72} className="opacity-15" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-raised text-foreground shadow-sm">
                        <Lock className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                  {isAuthenticated === false ? (
                    <>
                      <span className="text-xs font-semibold text-foreground">Sign in to continue</span>
                      <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                        Create a free account or sign in to generate, download, and manage your QR codes.
                      </p>
                      {onGuestAction ? (
                        <button
                          type="button"
                          className="mt-2.5 inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                          onClick={onGuestAction}
                        >
                          Generate QR
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-foreground">Free Trial Expired</span>
                      <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                        Your 14-day free trial has ended. Upgrade to Pro to generate, download, and manage your QR codes.
                      </p>
                      {onTrialExpired ? (
                        <button
                          type="button"
                          className="mt-2.5 inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                          onClick={onTrialExpired}
                        >
                          Upgrade to Pro
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              ) : current ? (
                <div
                  role="img"
                  aria-label="QR code preview"
                  className="relative h-full w-full [&>svg]:h-full [&>svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: current.svg }}
                />
              ) : (
                <QrPlaceholderGraphic size={96} className={payload ? "opacity-100" : "opacity-30"} />
              )}
            </div>
          </div>

          {!payload ? (
            <p className="text-center text-xs text-muted-foreground">
              {pendingFirstSave
                ? "Save to generate your scannable dynamic QR code."
                : "Enter content to preview your QR code."}
            </p>
          ) : isAuthenticated === false ? (
            <p className="text-center text-xs text-muted-foreground">
              Sign in to generate scannable QR code.
            </p>
          ) : isTrialExpired ? (
            <p className="text-center text-xs text-muted-foreground">
              Upgrade to Pro to generate scannable QR code.
            </p>
          ) : current && current.warnings.length > 0 ? (
            <ul className="flex flex-col gap-1 text-center text-xs text-warning">
              {current.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-xs text-muted-foreground">Scan to test.</p>
          )}
        </>
      ) : (
        <DestinationPreviewSection
          qrType={qrType}
          content={content}
          slug={slug}
          publicToken={publicToken}
        />
      )}
    </Card>
  );
}

interface DestinationPreviewSectionProps {
  qrType: QRType;
  content: Record<string, unknown>;
  slug?: string | null;
  publicToken?: string | null;
}

function DestinationPreviewSection({
  qrType,
  content,
  slug,
  publicToken,
}: DestinationPreviewSectionProps) {
  if (qrType === "pdf") {
    const pdfBlobUrl =
      typeof content.blobUrl === "string"
        ? content.blobUrl
        : typeof content.path === "string"
          ? getLocalPdfBlobUrl(content.path)
          : null;
    const pdfDisplayName =
      typeof content.publicTitle === "string" && content.publicTitle.trim().length > 0
        ? content.publicTitle.trim()
        : typeof content.fileName === "string"
          ? content.fileName
          : "document.pdf";
    const isDirect = content.openDirectly === true;
    const pdfUrl =
      pdfBlobUrl ??
      (slug ? `/api/public-pdf/${slug}` : publicToken ? `/api/pdf-view/${publicToken}` : null);

    if (!pdfUrl) {
      return (
        <div
          role="region"
          aria-label="Destination preview"
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground"
        >
          <FileText className="h-8 w-8 text-muted-foreground/50" />
          <p className="font-medium text-foreground">No PDF uploaded yet</p>
          <p className="text-[11px]">Upload a PDF to preview what opens after scanning.</p>
        </div>
      );
    }

    return (
      <div role="region" aria-label="Destination preview" className="flex w-full flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">
            {isDirect ? "Direct PDF Document" : "PDF Landing Page"}
          </span>
          {pdfBlobUrl ? (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              Local preview
            </span>
          ) : null}
        </div>

        {isDirect ? (
          <div className="flex flex-col gap-2.5">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-border bg-muted/20 shadow-inner">
              <object
                data={pdfUrl}
                type="application/pdf"
                className="h-full w-full"
              >
                <iframe
                  src={pdfUrl}
                  title={`Preview of ${pdfDisplayName}`}
                  className="h-full w-full border-0"
                >
                  <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-xs text-muted-foreground">
                    <FileText className="h-8 w-8 text-primary" />
                    <p className="font-medium text-foreground truncate max-w-full px-2">{pdfDisplayName}</p>
                    <p className="text-[11px]">PDF ready for scanners</p>
                  </div>
                </iframe>
              </object>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-raised p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="truncate font-medium text-foreground">{pdfDisplayName}</span>
                <span className="text-[11px] text-muted-foreground">Direct PDF</span>
              </div>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open PDF in new tab</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 shadow-sm">
            <div className="flex items-center justify-between min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{pdfDisplayName}</p>
              <span className="text-[10px] text-muted-foreground">Landing Page</span>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-muted/20">
              <object
                data={pdfUrl}
                type="application/pdf"
                className="h-full w-full"
              >
                <iframe
                  src={pdfUrl}
                  title={`Landing page preview of ${pdfDisplayName}`}
                  className="h-full w-full border-0"
                >
                  <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-xs text-muted-foreground">
                    <FileText className="h-8 w-8 text-primary" />
                    <p className="font-medium text-foreground truncate max-w-full px-2">{pdfDisplayName}</p>
                    <p className="text-[11px]">PDF ready for scanners</p>
                  </div>
                </iframe>
              </object>
            </div>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF</span>
            </a>
          </div>
        )}
      </div>
    );
  }

  if (qrType === "url") {
    const rawUrl = typeof content.url === "string" ? content.url.trim() : "";
    if (!rawUrl) {
      return (
        <div
          role="region"
          aria-label="Destination preview"
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground"
        >
          <p className="font-medium text-foreground">No URL entered yet</p>
          <p className="text-[11px]">Enter a destination URL to preview.</p>
        </div>
      );
    }

    let parsedHost = "";
    let formattedUrl = rawUrl;
    try {
      const u = new URL(
        rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : `https://${rawUrl}`,
      );
      parsedHost = u.hostname;
      formattedUrl = u.toString();
    } catch {
      parsedHost = rawUrl;
    }

    return (
      <div role="region" aria-label="Destination preview" className="flex w-full flex-col gap-3">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Website Redirect</span>
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {parsedHost}
            </span>
          </div>
          <p className="break-all font-mono text-xs text-muted-foreground">{formattedUrl}</p>
          <a
            href={formattedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Visit website
          </a>
          <p className="text-[11px] text-muted-foreground">
            Scanners will open this external URL directly.
          </p>
        </div>
      </div>
    );
  }

  if (qrType === "location") {
    const lat = content.latitude !== undefined && content.latitude !== null ? String(content.latitude) : "";
    const lng = content.longitude !== undefined && content.longitude !== null ? String(content.longitude) : "";
    const address = typeof content.query === "string" ? content.query : "";
    const hasCoords = lat !== "" && lng !== "";

    if (!hasCoords && !address) {
      return (
        <div
          role="region"
          aria-label="Destination preview"
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground"
        >
          <p className="font-medium text-foreground">No coordinates set</p>
          <p className="text-[11px]">Enter coordinates to preview map destination.</p>
        </div>
      );
    }

    const mapUrl = hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

    return (
      <div role="region" aria-label="Destination preview" className="flex w-full flex-col gap-3">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Map Location</span>
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              Maps
            </span>
          </div>
          {hasCoords ? (
            <p className="font-mono text-xs text-foreground">
              {lat}, {lng}
            </p>
          ) : null}
          {address ? <p className="text-xs text-muted-foreground">{address}</p> : null}
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Open in Maps
          </a>
        </div>
      </div>
    );
  }

  // Generic destination summary for other types (wifi, vcard, email, barcode_2d, etc.)
  return (
    <div
      role="region"
      aria-label="Destination preview"
      className="flex w-full flex-col gap-2 rounded-xl border border-border bg-background p-4 text-xs shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground capitalize">{qrType.replace("_", " ")}</span>
        <span className="text-[10px] text-muted-foreground">Action on scan</span>
      </div>
      <p className="text-muted-foreground">
        Scanning this code triggers native device actions for {qrType.replace("_", " ")} content.
      </p>
    </div>
  );
}
