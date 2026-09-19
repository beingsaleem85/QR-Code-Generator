import { describe, expect, it } from "vitest";
import { locationQrSchema } from "@/lib/validation/qr/location";
import { buildLocationPayload } from "@/lib/qr/payload-builders/location";

describe("Location QR", () => {
  describe("schema validation", () => {
    it("accepts valid positive coordinates", () => {
      const result = locationQrSchema.safeParse({
        latitude: 37.7749,
        longitude: -122.4194,
        query: "San Francisco",
      });
      expect(result.success).toBe(true);
    });

    it("accepts boundary coordinates (-90, 90, -180, 180)", () => {
      expect(locationQrSchema.safeParse({ latitude: -90, longitude: -180 }).success).toBe(true);
      expect(locationQrSchema.safeParse({ latitude: 90, longitude: 180 }).success).toBe(true);
      expect(locationQrSchema.safeParse({ latitude: 0, longitude: 0 }).success).toBe(true);
    });

    it("rejects latitude outside [-90, 90]", () => {
      expect(locationQrSchema.safeParse({ latitude: 90.001, longitude: 0 }).success).toBe(false);
      expect(locationQrSchema.safeParse({ latitude: -90.001, longitude: 0 }).success).toBe(false);
    });

    it("rejects longitude outside [-180, 180]", () => {
      expect(locationQrSchema.safeParse({ latitude: 0, longitude: 180.001 }).success).toBe(false);
      expect(locationQrSchema.safeParse({ latitude: 0, longitude: -180.001 }).success).toBe(false);
    });

    it("coerces string coordinates to numbers", () => {
      const parsed = locationQrSchema.parse({
        latitude: "40.7128",
        longitude: "-74.0060",
      });
      expect(parsed.latitude).toBe(40.7128);
      expect(parsed.longitude).toBe(-74.006);
    });

    it("rejects non-finite coordinate values", () => {
      expect(locationQrSchema.safeParse({ latitude: "not-a-number", longitude: 0 }).success).toBe(
        false,
      );
    });
  });

  describe("payload builder", () => {
    it("builds a Google Maps URL by default", () => {
      const payload = buildLocationPayload({
        latitude: 37.7749,
        longitude: -122.4194,
        query: "",
        format: "maps",
      });
      expect(payload).toBe("https://www.google.com/maps/search/?api=1&query=37.7749,-122.4194");
    });

    it("includes query in Google Maps URL when provided", () => {
      const payload = buildLocationPayload({
        latitude: 37.7749,
        longitude: -122.4194,
        query: "Union Square",
        format: "maps",
      });
      expect(payload).toContain("https://www.google.com/maps/search/?api=1&query=");
      expect(payload).toContain("Union%20Square");
    });

    it("builds a standard RFC 5870 geo: URI when requested", () => {
      const payload = buildLocationPayload({
        latitude: 51.5074,
        longitude: -0.1278,
        query: "",
        format: "geo",
      });
      expect(payload).toBe("geo:51.5074,-0.1278");
    });

    it("includes query in geo: URI according to RFC 5870", () => {
      const payload = buildLocationPayload({
        latitude: 51.5074,
        longitude: -0.1278,
        query: "Big Ben",
        format: "geo",
      });
      expect(payload).toBe("geo:51.5074,-0.1278?q=Big%20Ben");
    });
  });
});
