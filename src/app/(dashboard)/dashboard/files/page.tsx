import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FilesView } from "@/components/files/FilesView";
import { Button } from "@/components/ui/Button";
import { MOCK_ASSETS } from "@/lib/files/mock-data";
import { MOCK_QR_CODES } from "@/lib/qr/mock-data";

export default function FilesPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="Files"
        action={
          <Button size="sm" disabled title="File uploads arrive with Module 3.8">
            Upload file
          </Button>
        }
      />

      <div className="px-4 pb-6 sm:px-6">
        <FilesView initialAssets={MOCK_ASSETS} qrCodes={MOCK_QR_CODES} />
      </div>
    </div>
  );
}
