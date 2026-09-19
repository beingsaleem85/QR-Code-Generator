import type { Metadata } from "next";
import { QRGeneratorShell } from "@/components/qr/QRGeneratorShell";
import { createClient } from "@/lib/supabase/server";
import { getMyTrialInfo } from "@/lib/account/actions";

export const metadata: Metadata = {
  title: "QR Code Generator",
  description:
    "Create a custom QR code for a link, file, or hosted page — free-form design, static or dynamic, ready to download in seconds.",
  alternates: { canonical: "/qr-generator" },
};

export default async function QrGeneratorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const trial = user ? await getMyTrialInfo() : null;

  return (
    <div className="p-6">
      <QRGeneratorShell
        isAuthenticated={Boolean(user)}
        isTrialExpired={trial?.isTrialExpired ?? false}
      />
    </div>
  );
}
