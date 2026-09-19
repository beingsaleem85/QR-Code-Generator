"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { QRCodeTable } from "@/components/dashboard/QRCodeTable";
import { QRCodeCard } from "@/components/dashboard/QRCodeCard";
import { BulkActionsBar, type BulkBusyAction } from "@/components/dashboard/BulkActionsBar";
import { bulkDeleteQrCodes, bulkSetQrCodeStatus } from "@/lib/qr/bulk-actions";
import { resolveEncodedPayload, slugifyForFilename } from "@/lib/qr/render";
import { renderStyledQrPngDataUrl } from "@/lib/qr/styled-svg";
import { createZipBlob, type ZipFileInput } from "@/lib/utils/zip";
import type { QrCodeRecord } from "@/lib/qr/records";
import type { QrFolder } from "@/types/folder";

interface QRCodeListContainerProps {
  items: QrCodeRecord[];
  folders?: QrFolder[];
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const commaIndex = dataUrl.indexOf(",");
  const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function QRCodeListContainer({ items, folders = [] }: QRCodeListContainerProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busyAction, setBusyAction] = useState<BulkBusyAction>(null);
  const [message, setMessage] = useState<{ type: "info" | "error" | "success"; text: string } | null>(
    null,
  );

  const visibleIdSet = new Set(items.map((item) => item.id));
  const activeSelectedIds = new Set(Array.from(selectedIds).filter((id) => visibleIdSet.has(id)));

  const visibleIds = items.map((item) => item.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => activeSelectedIds.has(id));
  const someSelected = visibleIds.some((id) => activeSelectedIds.has(id));

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleIds));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (activeSelectedIds.size === 0) return;
    setBusyAction("delete");
    setMessage(null);

    const idsToDelete = Array.from(activeSelectedIds);
    const result = await bulkDeleteQrCodes(idsToDelete);
    setBusyAction(null);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }

    if (result.data) {
      const { deletedIds, failedIds } = result.data;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of deletedIds) next.delete(id);
        return next;
      });

      if (failedIds.length > 0) {
        setMessage({
          type: "info",
          text: `Deleted ${deletedIds.length} QR code(s). ${failedIds.length} item(s) could not be deleted.`,
        });
      } else {
        setMessage({
          type: "success",
          text: `Successfully deleted ${deletedIds.length} QR code(s).`,
        });
      }
    }

    router.refresh();
  };

  const handleBulkStatusChange = async (targetStatus: "active" | "paused") => {
    if (activeSelectedIds.size === 0) return;
    setBusyAction(targetStatus === "paused" ? "pause" : "resume");
    setMessage(null);

    const idsToUpdate = Array.from(activeSelectedIds);
    const result = await bulkSetQrCodeStatus(idsToUpdate, targetStatus);
    setBusyAction(null);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }

    if (result.data) {
      const { updatedIds, skippedIds, failedIds, message: detailMsg } = result.data;
      const actionName = targetStatus === "paused" ? "paused" : "resumed";

      let statusText = `Updated ${updatedIds.length} QR code(s) to ${actionName}.`;
      if (skippedIds.length > 0) {
        statusText += ` ${detailMsg || `${skippedIds.length} item(s) skipped.`}`;
      }
      if (failedIds.length > 0) {
        statusText += ` ${failedIds.length} item(s) failed.`;
      }

      setMessage({ type: "info", text: statusText });
    }

    router.refresh();
  };

  const handleBulkDownload = async () => {
    if (activeSelectedIds.size === 0) return;
    setBusyAction("download");
    setMessage(null);

    try {
      const selectedRecords = items.filter((item) => activeSelectedIds.has(item.id));

      if (selectedRecords.length === 1) {
        // Single selection: standard PNG download
        const qr = selectedRecords[0];
        const payload = resolveEncodedPayload(
          qr.mode,
          qr.qrType,
          qr.payloadData,
          qr.slug,
          qr.publicToken,
        );
        if (!payload) {
          setMessage({ type: "error", text: "Cannot generate content for selected QR code." });
          return;
        }
        const { dataUrl } = await renderStyledQrPngDataUrl(payload, qr.designConfig, 1024);
        triggerDownload(dataUrl, `${slugifyForFilename(qr.name)}-qr.png`);
        return;
      }

      // Multiple selection: generate ZIP archive
      const files: ZipFileInput[] = [];
      const usedNames = new Set<string>();

      for (const qr of selectedRecords) {
        const payload = resolveEncodedPayload(
          qr.mode,
          qr.qrType,
          qr.payloadData,
          qr.slug,
          qr.publicToken,
        );
        if (!payload) continue;

        const { dataUrl } = await renderStyledQrPngDataUrl(payload, qr.designConfig, 1024);
        const bytes = dataUrlToBytes(dataUrl);

        // Safe filename with collision prevention
        const baseName = `${slugifyForFilename(qr.name)}-${qr.id.slice(0, 8)}`;
        let filename = `${baseName}.png`;
        let counter = 1;
        while (usedNames.has(filename)) {
          filename = `${baseName}-${counter}.png`;
          counter++;
        }
        usedNames.add(filename);

        files.push({ name: filename, data: bytes });
      }

      if (files.length === 0) {
        setMessage({ type: "error", text: "No downloadable content found for selected QR codes." });
        return;
      }

      const zipBlob = createZipBlob(files);
      const zipUrl = URL.createObjectURL(zipBlob);
      const zipDate = new Date().toISOString().slice(0, 10);
      triggerDownload(zipUrl, `qr-codes-${zipDate}.zip`);
      URL.revokeObjectURL(zipUrl);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to download selected QR codes.",
      });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {message ? (
        <Alert variant={message.type === "error" ? "error" : "info"}>{message.text}</Alert>
      ) : null}

      <BulkActionsBar
        selectedCount={activeSelectedIds.size}
        onClearSelection={handleClearSelection}
        onBulkDelete={handleBulkDelete}
        onBulkPause={() => handleBulkStatusChange("paused")}
        onBulkResume={() => handleBulkStatusChange("active")}
        onBulkDownload={handleBulkDownload}
        busyAction={busyAction}
      />

      <Card className="hidden overflow-x-auto md:block">
        <QRCodeTable
          qrCodes={items}
          folders={folders}
          selectedIds={activeSelectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          allSelected={allSelected}
          someSelected={someSelected}
        />
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
        {items.map((qrCode) => (
          <QRCodeCard
            key={qrCode.id}
            qrCode={qrCode}
            folders={folders}
            selected={activeSelectedIds.has(qrCode.id)}
            onToggleSelect={handleToggleSelect}
          />
        ))}
      </div>
    </div>
  );
}