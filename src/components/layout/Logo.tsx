import Link from "next/link";

/**
 * Original abstract mark — three corner squares echo a QR finder pattern
 * without reproducing any real product's actual logo. "QRForge" is a
 * placeholder brand name (this project has no fixed name yet); swap it
 * freely without touching the mark itself.
 */
export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="QRForge home">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="7" height="7" rx="1.5" fill="var(--color-primary)" />
        <rect
          x="15"
          y="2"
          width="7"
          height="7"
          rx="1.5"
          fill="var(--color-primary)"
          opacity="0.55"
        />
        <rect
          x="2"
          y="15"
          width="7"
          height="7"
          rx="1.5"
          fill="var(--color-primary)"
          opacity="0.55"
        />
        <rect x="15" y="15" width="3" height="3" rx="1" fill="var(--color-primary)" />
        <rect
          x="19"
          y="15"
          width="3"
          height="3"
          rx="1"
          fill="var(--color-primary)"
          opacity="0.55"
        />
        <rect
          x="15"
          y="19"
          width="3"
          height="3"
          rx="1"
          fill="var(--color-primary)"
          opacity="0.55"
        />
      </svg>
      <span className="text-base font-semibold text-foreground">QRForge</span>
    </Link>
  );
}
