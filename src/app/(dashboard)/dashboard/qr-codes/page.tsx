import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { QRCodeCard } from "@/components/dashboard/QRCodeCard";
import { QRCodeTable } from "@/components/dashboard/QRCodeTable";
import { buttonVariants } from "@/components/ui/Button";
import { MOCK_QR_CODES } from "@/lib/qr/mock-data";

export default function QrCodesListPage() {
  const qrCodes = MOCK_QR_CODES;

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="Your QR Codes"
        action={
          <Link href="/dashboard/qr-codes/new" className={buttonVariants({ size: "sm" })}>
            Create QR
          </Link>
        }
      />

      <div className="px-4 pb-6 sm:px-6">
        {qrCodes.length === 0 ? (
          <EmptyState
            title="No QR codes yet"
            description="Create your first QR code to see it here."
            action={
              <Link
                href="/dashboard/qr-codes/new"
                className={buttonVariants({ className: "mt-2" })}
              >
                Create QR Code
              </Link>
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <QRCodeTable qrCodes={qrCodes} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
              {qrCodes.map((qrCode) => (
                <QRCodeCard key={qrCode.id} qrCode={qrCode} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
