import { describe, expect, it } from "vitest";
import { computeCrc32, createZipArchive, createZipBlob } from "@/lib/utils/zip";

describe("zip utility", () => {
  it("computes standard CRC32 correctly for standard test vector '123456789'", () => {
    const data = new TextEncoder().encode("123456789");
    const crc = computeCrc32(data);
    // Standard IEEE 802.3 CRC32 for "123456789" is 0xcbf43926 (3421780262)
    expect(crc).toBe(0xcbf43926);
  });

  it("creates a valid PKZip archive for single file", () => {
    const files = [
      { name: "test.txt", data: new TextEncoder().encode("Hello World!") },
    ];
    const archive = createZipArchive(files);
    const view = new DataView(archive.buffer);

    // Check Local File Header signature 0x04034b50
    expect(view.getUint32(0, true)).toBe(0x04034b50);

    // End of Central Directory signature 0x06054b50
    const eocdOffset = archive.length - 22;
    expect(view.getUint32(eocdOffset, true)).toBe(0x06054b50);
    // Total entries
    expect(view.getUint16(eocdOffset + 10, true)).toBe(1);
  });

  it("creates a valid PKZip archive for multiple files and sanitizes filenames", () => {
    const files = [
      { name: "../../unsafe/path/qr1.png", data: new Uint8Array([1, 2, 3, 4]) },
      { name: "folder/qr2.png", data: new Uint8Array([5, 6, 7, 8]) },
    ];
    const archive = createZipArchive(files);
    const view = new DataView(archive.buffer);

    // End of Central Directory signature
    const eocdOffset = archive.length - 22;
    expect(view.getUint32(eocdOffset, true)).toBe(0x06054b50);
    expect(view.getUint16(eocdOffset + 10, true)).toBe(2);

    // Verify traversal is stripped
    const text = new TextDecoder().decode(archive);
    expect(text).not.toContain("../");
  });

  it("creates a Blob with application/zip MIME type", () => {
    const files = [
      { name: "qr.png", data: new Uint8Array([0x89, 0x50, 0x4e, 0x47]) },
    ];
    const blob = createZipBlob(files);
    expect(blob.type).toBe("application/zip");
    expect(blob.size).toBeGreaterThan(0);
  });
});