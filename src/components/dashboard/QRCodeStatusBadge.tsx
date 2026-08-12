import type { QRCodeStatus } from "@/types/qr-record";

const STATUS_STYLES: Record<QRCodeStatus, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-amber-100 text-amber-800",
  archived: "bg-gray-100 text-gray-600",
};

interface QRCodeStatusBadgeProps {
  status: QRCodeStatus;
}

export function QRCodeStatusBadge({ status }: QRCodeStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
