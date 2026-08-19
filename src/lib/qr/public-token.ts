import "server-only";
import { randomBytes } from "node:crypto";

/**
 * Opaque, cryptographically random public identifier for a PDF QR's
 * direct-open viewer link (`/v/[token]`) — deliberately unrelated to the
 * QR's `slug`, database id, filename, or owner, so a camera app's QR
 * preview (or anyone inspecting the printed code) can't infer anything
 * about the file behind it. 12 raw bytes (96 bits of entropy) base64url-
 * encoded to exactly 16 URL-safe characters, no padding.
 */
const TOKEN_BYTE_LENGTH = 12;

export function generatePublicToken(): string {
  return randomBytes(TOKEN_BYTE_LENGTH).toString("base64url");
}
