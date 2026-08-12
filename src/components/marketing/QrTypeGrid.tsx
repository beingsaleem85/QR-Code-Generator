import Link from "next/link";
import { listQrTypeDefinitions } from "@/lib/qr/registry";
import { SectionHeading } from "@/components/marketing/SectionHeading";

/**
 * Reads the same registry that drives the real generator's type selector
 * (Module 1.3/1.6) — the supported-types list is never duplicated by hand.
 */
export function QrTypeGrid() {
  const types = listQrTypeDefinitions();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeading
        eyebrow="Supported types"
        title="One generator, every QR type you need"
        description="From a simple link to a full Wi-Fi login — pick a type and go."
      />
      <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {types.map((type) => (
          <li key={type.key}>
            <Link
              href="/qr-types"
              className="flex h-full items-center justify-center rounded-lg border border-border bg-surface px-3 py-3 text-center text-sm font-medium text-foreground hover:border-primary hover:text-primary"
            >
              {type.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
