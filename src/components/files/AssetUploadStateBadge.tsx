import type { AssetUploadState } from "@/types/asset";

const STATE_STYLES: Record<AssetUploadState, string> = {
  ready: "bg-success/10 text-success",
  uploading: "bg-primary/10 text-primary",
  failed: "bg-destructive/10 text-destructive",
};

const STATE_LABEL: Record<AssetUploadState, string> = {
  ready: "Ready",
  uploading: "Uploading",
  failed: "Failed",
};

interface AssetUploadStateBadgeProps {
  state: AssetUploadState;
}

export function AssetUploadStateBadge({ state }: AssetUploadStateBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATE_STYLES[state]}`}
    >
      {STATE_LABEL[state]}
    </span>
  );
}
