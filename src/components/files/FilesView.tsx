"use client";

import { useState } from "react";
import { AssetCard } from "@/components/files/AssetCard";
import { AssetTable } from "@/components/files/AssetTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import type { QRCodeSummary } from "@/types/qr-record";
import type { QrAsset } from "@/types/asset";

interface FilesViewProps {
  initialAssets: QrAsset[];
  qrCodes: QRCodeSummary[];
}

/**
 * Owns the asset list in local state so the delete-with-confirmation flow
 * (`DeleteAssetButton`) is genuinely interactive today. Deleting only
 * updates this component's state — nothing is persisted, and a reload
 * brings back the full mock list. Real deletion (Storage object +
 * `qr_assets` row) arrives with Module 3.8.
 */
export function FilesView({ initialAssets, qrCodes }: FilesViewProps) {
  const [assets, setAssets] = useState(initialAssets);
  const qrCodesById = new Map(qrCodes.map((qrCode) => [qrCode.id, qrCode]));

  const handleDelete = (id: string) => {
    setAssets((current) => current.filter((asset) => asset.id !== id));
  };

  if (assets.length === 0) {
    return (
      <EmptyState
        title="No files yet"
        description="Files you upload for QR codes (logos, PDFs, images) will appear here."
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <AssetTable assets={assets} qrCodesById={qrCodesById} onDelete={handleDelete} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
        {assets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            linkedQrCode={asset.linkedQrCodeId ? qrCodesById.get(asset.linkedQrCodeId) : undefined}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </>
  );
}
