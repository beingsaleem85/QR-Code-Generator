// Client-side cache for temporary local PDF blob URLs created during file selection.
// Kept in memory so the local Chrome PDF viewer can immediately preview the file
// before or after saving without storing large or transient blob URLs in the persistent content state.

const blobUrls = new Map<string, string>();

export function setLocalPdfBlobUrl(key: string, url: string): void {
  const existing = blobUrls.get(key);
  if (existing && existing !== url) {
    try {
      URL.revokeObjectURL(existing);
    } catch {
      // no-op
    }
  }
  blobUrls.set(key, url);
}

export function getLocalPdfBlobUrl(key: string): string | null {
  return blobUrls.get(key) ?? null;
}

export function revokeLocalPdfBlobUrl(key: string): void {
  const existing = blobUrls.get(key);
  if (existing) {
    try {
      URL.revokeObjectURL(existing);
    } catch {
      // no-op
    }
    blobUrls.delete(key);
  }
}
