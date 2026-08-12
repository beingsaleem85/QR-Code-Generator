interface QrPlaceholderGraphicProps {
  size?: number;
  className?: string;
}

/**
 * Original abstract corner-square motif (echoes a QR finder pattern
 * without reproducing any real product's mark) — used everywhere a
 * placeholder QR/brand graphic is needed until real rendering exists
 * (Module 3.3). Extracted once 4 places needed the same SVG.
 */
export function QrPlaceholderGraphic({ size = 96, className }: QrPlaceholderGraphicProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect x="2" y="2" width="7" height="7" rx="1.5" fill="var(--color-primary)" />
      <rect x="15" y="2" width="7" height="7" rx="1.5" fill="var(--color-primary)" opacity="0.55" />
      <rect x="2" y="15" width="7" height="7" rx="1.5" fill="var(--color-primary)" opacity="0.55" />
      <rect x="15" y="15" width="3" height="3" rx="1" fill="var(--color-primary)" />
      <rect x="19" y="15" width="3" height="3" rx="1" fill="var(--color-primary)" opacity="0.55" />
      <rect x="15" y="19" width="3" height="3" rx="1" fill="var(--color-primary)" opacity="0.55" />
    </svg>
  );
}
