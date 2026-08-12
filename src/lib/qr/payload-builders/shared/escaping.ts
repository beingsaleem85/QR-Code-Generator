/**
 * Escapes a value for the WIFI: QR payload format. Per spec, `\`, `;`,
 * `,`, `:`, and `"` must be backslash-escaped.
 */
export function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

/**
 * Escapes a value for vCard/iCalendar TEXT properties. Per RFC 6350 /
 * RFC 5545, `\`, `;`, `,`, and newlines must be backslash-escaped.
 */
export function escapeStructuredTextValue(value: string): string {
  return value.replace(/([\\,;])/g, "\\$1").replace(/\r?\n/g, "\\n");
}
