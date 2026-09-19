import { Card } from "@/components/ui/Card";

/** Shared "paused/archived" state for every public entry point that resolves
 * a QR before deciding what to render (`/p/[slug]`, `/v/[token]`) — kept in
 * one place so the wording/markup can't drift between them. */
export function InactiveQrCard() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-sm p-6 text-center">
        <p className="text-sm font-medium text-foreground">This QR code is currently inactive.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The QR code owner needs to reactivate their QRForge account.
        </p>
      </Card>
    </main>
  );
}
