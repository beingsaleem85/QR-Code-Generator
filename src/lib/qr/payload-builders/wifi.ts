import type { WifiQrInput } from "@/lib/validation/qr";
import { escapeWifiValue } from "./shared/escaping";

export function buildWifiPayload(input: WifiQrInput): string {
  const ssid = escapeWifiValue(input.ssid);
  const hidden = input.hidden ? "true" : "false";
  const passwordSegment =
    input.encryption === "nopass" || !input.password ? "" : `P:${escapeWifiValue(input.password)};`;

  return `WIFI:T:${input.encryption};S:${ssid};${passwordSegment}H:${hidden};;`;
}
