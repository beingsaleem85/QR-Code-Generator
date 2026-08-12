import { describe, expect, it } from "vitest";
import { wifiQrSchema } from "@/lib/validation/qr";
import { buildWifiPayload } from "@/lib/qr/payload-builders";

describe("wifi QR", () => {
  it("builds a WPA payload", () => {
    const parsed = wifiQrSchema.parse({
      ssid: "MyNetwork",
      password: "hunter2",
      encryption: "WPA",
    });
    expect(buildWifiPayload(parsed)).toBe("WIFI:T:WPA;S:MyNetwork;P:hunter2;H:false;;");
  });

  it("builds an open-network payload with no password segment", () => {
    const parsed = wifiQrSchema.parse({ ssid: "Free Wifi", encryption: "nopass" });
    expect(buildWifiPayload(parsed)).toBe("WIFI:T:nopass;S:Free Wifi;H:false;;");
  });

  it("marks hidden networks", () => {
    const parsed = wifiQrSchema.parse({
      ssid: "Hidden",
      password: "secret123",
      encryption: "WPA",
      hidden: true,
    });
    expect(buildWifiPayload(parsed)).toBe("WIFI:T:WPA;S:Hidden;P:secret123;H:true;;");
  });

  it("escapes special characters in the SSID and password", () => {
    const parsed = wifiQrSchema.parse({
      ssid: 'Net;work,"Name"',
      password: "pa:ss\\word",
      encryption: "WPA",
    });
    expect(buildWifiPayload(parsed)).toBe(
      'WIFI:T:WPA;S:Net\\;work\\,\\"Name\\";P:pa\\:ss\\\\word;H:false;;',
    );
  });

  it("requires a password unless encryption is nopass", () => {
    expect(() => wifiQrSchema.parse({ ssid: "MyNetwork", encryption: "WPA" })).toThrow();
  });
});
