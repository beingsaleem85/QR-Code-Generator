/**
 * Contract for resolving a dynamic QR slug to its current destination.
 * Implemented for real in Module 3.6 (Dynamic QR Codes) once the
 * `qr_codes` table and Supabase access exist.
 */
export type RedirectResolution =
  { status: "ok"; destinationUrl: string } | { status: "not_found" } | { status: "inactive" };

export async function resolveDynamicQrRedirect(slug: string): Promise<RedirectResolution> {
  void slug;
  return { status: "not_found" };
}
