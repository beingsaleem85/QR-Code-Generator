import { Card } from "@/components/ui/Card";

interface PdfDirectOpenRedirectProps {
  url: string;
}

/**
 * A real HTTP redirect (`redirect()` from `next/navigation`) would be the
 * obvious choice here, but this app's root `loading.tsx` puts every route
 * — this one included — into a Suspense/streaming render, and Next only
 * emits a clean HTTP 3xx when a redirect fires *before* any streaming has
 * started (documented in `redirect()`'s own reference: "When used in a
 * streaming context, this will insert a meta tag to emit the redirect on
 * the client side" instead). Confirmed live: `redirect()` here produced a
 * 200 response with a `<meta http-equiv="refresh" content="1;url=...">`
 * — technically correct, but a full second slower than it needs to be for
 * "scan a QR, see the PDF." Exactly the same root cause already documented
 * for `notFound()` returning 200 instead of 404 (`docs/ARCHITECTURE.md`,
 * Module 2.7) — not a new bug, the same known architectural quirk showing
 * up in a second place.
 *
 * This renders its own minimal instant-redirect page instead: a same-tick
 * `<script>` navigation (fires as soon as this HTML parses — for a real,
 * JS-enabled scanning device this is effectively instant, not a full
 * second later) with a 0-delay `<meta refresh>` as a no-JS fallback. The
 * URL is JSON-stringified before being interpolated into the inline
 * script, the same escaping discipline this app's other inline JSON-LD
 * script already uses (`/faq`), even though `url` is always a
 * Supabase-signed URL here, never raw user input.
 */
export function PdfDirectOpenRedirect({ url }: PdfDirectOpenRedirectProps) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <meta httpEquiv="refresh" content={`0;url=${url}`} />
      <script
        dangerouslySetInnerHTML={{ __html: `window.location.replace(${JSON.stringify(url)});` }}
      />
      <Card className="max-w-sm p-6 text-center">
        <p className="text-sm font-medium text-foreground">Opening your file…</p>
        <p className="mt-1 text-xs text-muted-foreground">
          If it doesn&apos;t open automatically,{" "}
          <a href={url} className="font-medium text-primary hover:underline">
            tap here
          </a>
          .
        </p>
      </Card>
    </main>
  );
}
