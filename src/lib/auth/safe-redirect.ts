/**
 * Validates redirect targets to prevent open-redirect vulnerabilities.
 * Rejects protocol-relative URLs (`//`), backslashes (`\`), absolute/external URLs,
 * and malformed paths. Only permits safe, relative same-origin paths starting with a single `/`.
 */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next) return fallback;
  const trimmed = next.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.includes("\\")
  ) {
    return fallback;
  }

  try {
    const dummyOrigin = "http://localhost";
    const parsed = new URL(trimmed, dummyOrigin);
    if (parsed.origin !== dummyOrigin) {
      return fallback;
    }
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return fallback;
  }
}
