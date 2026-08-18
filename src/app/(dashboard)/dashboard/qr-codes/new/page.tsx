"use client";

import { useEffect, useState } from "react";
import { QRGeneratorShell } from "@/components/qr/QRGeneratorShell";
import { takeDraft, type QrDraft } from "@/lib/qr/draft-storage";

/**
 * Checks for a draft staged by `QRGeneratorShell` when an unauthenticated
 * visitor on the public `/qr-generator` tried to save and got redirected
 * through login (Module 3.5) — restores it here rather than losing their
 * work. A one-render delay (draft starts `undefined`) avoids a hydration
 * mismatch between server and client, since sessionStorage only exists
 * client-side.
 */
export default function NewQrCodePage() {
  const [draft, setDraft] = useState<QrDraft | null | undefined>(undefined);

  useEffect(() => {
    // sessionStorage only exists client-side, so this one-time read can't
    // happen during the render that has to match server output — an
    // effect is the correct, standard way to defer it, not a case the
    // "avoid setState-in-effect" rule's cascading-render concern applies
    // to (there's no external-system subscription to model instead).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(takeDraft());
  }, []);

  if (draft === undefined) return null;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      {draft ? (
        <QRGeneratorShell
          initialName={draft.name}
          initialMode={draft.mode}
          initialQrType={draft.qrType}
          initialContent={draft.content}
          initialDesign={draft.design}
        />
      ) : (
        <QRGeneratorShell />
      )}
    </div>
  );
}
