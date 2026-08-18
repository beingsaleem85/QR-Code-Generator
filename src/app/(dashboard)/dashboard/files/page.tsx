import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FilesView } from "@/components/files/FilesView";
import { listQrAssets } from "@/lib/files/queries";
import { listQrCodes } from "@/lib/qr/queries";
import { toQrCodeSummary } from "@/lib/qr/records";

/**
 * Real data now (Module 3.8) — files are uploaded through a QR's own
 * content form (pdf/images/audio) at creation/edit time, not a standalone
 * upload flow here, so there's no separate "Upload file" action on this
 * page; it's purely a browsing/management view over what's already been
 * uploaded.
 */
export default async function FilesPage() {
  const [assets, qrCodes] = await Promise.all([
    listQrAssets(),
    listQrCodes({ includeArchived: true }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader title="Files" />

      <div className="px-4 pb-6 sm:px-6">
        <FilesView initialAssets={assets} qrCodes={qrCodes.map(toQrCodeSummary)} />
      </div>
    </div>
  );
}
