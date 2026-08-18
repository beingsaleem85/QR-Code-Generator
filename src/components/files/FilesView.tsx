"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AssetCard } from "@/components/files/AssetCard";
import { AssetTable } from "@/components/files/AssetTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { deleteQrAsset } from "@/lib/files/actions";
import type { QRCodeSummary } from "@/types/qr-record";
import type { QrAsset } from "@/types/asset";

interface FilesViewProps {
  initialAssets: QrAsset[];
  qrCodes: QRCodeSummary[];
}

/**
 * Real deletion now (Module 3.8): `deleteQrAsset` removes both the Storage
 * object and the `qr_assets` row, RLS-enforced server-side. `router
 * .refresh()` re-fetches the real list from the Server Component parent
 * rather than trusting local state to stay in sync — the same convention
 * `QRCodeRowActions` already established.
 */
export function FilesView({ initialAssets, qrCodes }: FilesViewProps) {
  const router = useRouter();
  const [assets, setAssets] = useState(initialAssets);
  const [error, setError] = useState<string | null>(null);
  const qrCodesById = new Map(qrCodes.map((qrCode) => [qrCode.id, qrCode]));

  const handleDelete = async (id: string) => {
    setError(null);
    const result = await deleteQrAsset(id);
    if (result.error) {
      setError(result.error);
      return;
    }
    setAssets((current) => current.filter((asset) => asset.id !== id));
    router.refresh();
  };

  if (assets.length === 0) {
    return (
      <EmptyState
        title="No files yet"
        description="Files you upload for QR codes (PDFs, gallery images, audio) will appear here."
      />
    );
  }

  return (
    <>
      {error ? (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}
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
