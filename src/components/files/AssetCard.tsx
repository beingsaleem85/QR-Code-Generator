import Link from "next/link";
import { AssetUploadStateBadge } from "@/components/files/AssetUploadStateBadge";
import { DeleteAssetButton } from "@/components/files/DeleteAssetButton";
import { Card } from "@/components/ui/Card";
import { formatBytes } from "@/lib/utils/format-bytes";
import type { QRCodeSummary } from "@/types/qr-record";
import type { QrAsset } from "@/types/asset";

interface AssetCardProps {
  asset: QrAsset;
  linkedQrCode?: QRCodeSummary;
  onDelete: (id: string) => void;
}

export function AssetCard({ asset, linkedQrCode, onDelete }: AssetCardProps) {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{asset.fileName}</p>
        <AssetUploadStateBadge state={asset.uploadState} />
      </div>
      <p className="text-xs text-muted-foreground">
        {asset.mimeType} &middot; {formatBytes(asset.sizeBytes)}
      </p>
      <p className="text-xs text-muted-foreground">
        {linkedQrCode ? (
          <Link
            href={`/dashboard/qr-codes/${linkedQrCode.id}`}
            className="text-primary hover:underline"
          >
            {linkedQrCode.name}
          </Link>
        ) : (
          "Unlinked"
        )}
      </p>
      <div className="mt-1 flex justify-end">
        <DeleteAssetButton fileName={asset.fileName} onConfirm={() => onDelete(asset.id)} />
      </div>
    </Card>
  );
}
