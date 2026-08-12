import Link from "next/link";
import { QrPlaceholderGraphic } from "@/components/ui/QrPlaceholderGraphic";

/**
 * "QRForge" is a placeholder brand name (this project has no fixed name
 * yet); swap it freely without touching the mark itself.
 */
export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="QRForge home">
      <QrPlaceholderGraphic size={26} />
      <span className="text-base font-semibold text-foreground">QRForge</span>
    </Link>
  );
}
