const UNITS = ["B", "KB", "MB", "GB"] as const;

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${unitIndex === 0 ? value : value.toFixed(1)} ${UNITS[unitIndex]}`;
}
