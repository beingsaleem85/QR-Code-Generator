const ITEMS = [
  "No login to start",
  "Free static QR codes",
  "PNG & SVG downloads",
  "Scan tracking for dynamic codes",
];

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-background">
      <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-8 gap-y-3 px-4 py-6 sm:px-6">
        {ITEMS.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-foreground">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
              className="text-primary"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
