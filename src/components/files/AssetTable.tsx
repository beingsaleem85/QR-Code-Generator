import Link from "next/link";
import { AssetUploadStateBadge } from "@/components/files/AssetUploadStateBadge";
import { DeleteAssetButton } from "@/components/files/DeleteAssetButton";
import { formatBytes } from "@/lib/utils/format-bytes";
import type { QRCodeSummary } from "@/types/qr-record";
import type { QrAsset } from "@/types/asset";

interface AssetTableProps {
  assets: QrAsset[];
  qrCodesById: Map<string, QRCodeSummary>;
  onDelete: (id: string) => void;
}

export function AssetTable({ assets, qrCodesById, onDelete }: AssetTableProps) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border text-xs text-muted-foreground uppercase">
          <th className="py-2 font-medium">File</th>
          <th className="py-2 font-medium">Type</th>
          <th className="py-2 font-medium">Size</th>
          <th className="py-2 font-medium">Linked QR code</th>
          <th className="py-2 font-medium">Status</th>
          <th className="py-2 font-medium">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {assets.map((asset) => {
          const linkedQrCode = asset.linkedQrCodeId
            ? qrCodesById.get(asset.linkedQrCodeId)
            : undefined;
          return (
            <tr key={asset.id} className="border-b border-border last:border-0">
              <td className="py-2 font-medium text-foreground">{asset.fileName}</td>
              <td className="py-2 text-muted-foreground">{asset.mimeType}</td>
              <td className="py-2 text-muted-foreground">{formatBytes(asset.sizeBytes)}</td>
              <td className="py-2 text-muted-foreground">
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
              </td>
              <td className="py-2">
                <AssetUploadStateBadge state={asset.uploadState} />
              </td>
              <td className="py-2 text-right">
                <DeleteAssetButton fileName={asset.fileName} onConfirm={() => onDelete(asset.id)} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
