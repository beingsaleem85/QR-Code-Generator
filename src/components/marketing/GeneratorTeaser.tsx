import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";
import { QrPlaceholderGraphic } from "@/components/ui/QrPlaceholderGraphic";

/**
 * A decorative teaser, not the real generator — the real interactive
 * QRGeneratorShell lives at /qr-generator (Module 1.6/2.4). Duplicating
 * live generation logic here would violate the "no duplicated QR
 * payload-building code" principle for no real benefit.
 */
export function GeneratorTeaser() {
  return (
    <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
      <Card className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:justify-between sm:p-8">
        <div className="flex w-full max-w-sm flex-col gap-3">
          <span className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            https://your-link.com
          </span>
          <Link href="/qr-generator" className={buttonVariants({ variant: "primary" })}>
            Generate My QR Code
          </Link>
          <p className="text-xs text-muted-foreground">
            The full generator has design controls, logo upload, and live preview.
          </p>
        </div>

        <QrPlaceholderGraphic size={120} className="shrink-0" />
      </Card>
    </section>
  );
}
