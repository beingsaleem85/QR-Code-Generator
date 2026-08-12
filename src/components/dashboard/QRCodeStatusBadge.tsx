import type { QRCodeStatus } from "@/types/qr-record";

const STATUS_STYLES: Record<QRCodeStatus, string> = {
  active: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  archived: "bg-background text-muted-foreground",
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
