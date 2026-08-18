import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { QRCodeCard } from "@/components/dashboard/QRCodeCard";
import { QRCodeTable } from "@/components/dashboard/QRCodeTable";
import { buttonVariants } from "@/components/ui/Button";
import { listQrCodes } from "@/lib/qr/queries";

interface QrCodesListPageProps {
  searchParams: Promise<{ archived?: string }>;
}

export default async function QrCodesListPage({ searchParams }: QrCodesListPageProps) {
  const { archived } = await searchParams;
  const showArchived = archived === "1";
  const qrCodes = await listQrCodes({ includeArchived: showArchived });
  const visibleQrCodes = showArchived ? qrCodes : qrCodes.filter((qr) => qr.status !== "archived");

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

      <div className="flex flex-col gap-4 px-4 pb-6 sm:px-6">
        <div className="flex justify-end">
          <Link
            href={showArchived ? "/dashboard/qr-codes" : "/dashboard/qr-codes?archived=1"}
            className="text-sm text-primary hover:underline"
          >
            {showArchived ? "Hide archived" : "Show archived"}
          </Link>
        </div>

        {visibleQrCodes.length === 0 ? (
          <EmptyState
            title={showArchived ? "No archived QR codes" : "No QR codes yet"}
            description={
              showArchived
                ? "QR codes you archive will show up here."
                : "Create your first QR code to see it here."
            }
            action={
              showArchived ? undefined : (
                <Link
                  href="/dashboard/qr-codes/new"
                  className={buttonVariants({ className: "mt-2" })}
                >
                  Create QR Code
                </Link>
              )
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <QRCodeTable qrCodes={visibleQrCodes} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
              {visibleQrCodes.map((qrCode) => (
                <QRCodeCard key={qrCode.id} qrCode={qrCode} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
