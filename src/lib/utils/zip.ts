/**
 * Lightweight, zero-dependency ZIP archive generator implementing standard
 * PKZip (Store / uncompressed mode 0).
 *
 * Safe for both browser (Blob) and Node.js environments.
 * Used for bulk QR downloads without introducing heavy external dependencies.
 */

// Precomputed CRC-32 table using IEEE 802.3 polynomial 0xEDB88320
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

export function computeCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipFileInput {
  name: string;
  data: Uint8Array;
}

/**
 * Encodes DOS date and time for a given Date object.
 */
function toDosDateTime(date: Date): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  const dosTime = (hours << 11) | (minutes << 5) | seconds;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;

  return { time: dosTime, date: dosDate };
}

/**
 * Creates a valid, standard PKZip archive containing the provided files.
 */
export function createZipArchive(files: ZipFileInput[], date = new Date()): Uint8Array {
  const { time: dosTime, date: dosDate } = toDosDateTime(date);
  const encoder = new TextEncoder();

  interface PreparedFile {
    nameBytes: Uint8Array;
    data: Uint8Array;
    crc32: number;
    localHeaderOffset: number;
  }

  const prepared: PreparedFile[] = [];
  let totalLocalSize = 0;

  for (const file of files) {
    // Sanitize filename: remove directory traversal sequences and leading slashes
    const sanitizedName = file.name.replace(/^[/\\]+/, "").replace(/\.\.[/\\]/g, "");
    const nameBytes = encoder.encode(sanitizedName);
    const crc = computeCrc32(file.data);

    prepared.push({
      nameBytes,
      data: file.data,
      crc32: crc,
      localHeaderOffset: totalLocalSize,
    });

    // 30 bytes fixed local header + filename length + file data length
    totalLocalSize += 30 + nameBytes.length + file.data.length;
  }

  let centralDirSize = 0;
  for (const item of prepared) {
    // 46 bytes fixed central directory header + filename length
    centralDirSize += 46 + item.nameBytes.length;
  }

  // 22 bytes fixed end of central directory record
  const totalZipSize = totalLocalSize + centralDirSize + 22;
  const buffer = new Uint8Array(totalZipSize);
  const view = new DataView(buffer.buffer);
  let offset = 0;

  // 1. Write Local File Headers + File Data
  for (const item of prepared) {
    view.setUint32(offset, 0x04034b50, true); // Local file header signature
    view.setUint16(offset + 4, 20, true); // Version needed to extract (2.0)
    view.setUint16(offset + 6, 0x0800, true); // General purpose bit flag (UTF-8)
    view.setUint16(offset + 8, 0, true); // Compression method (0 = Store)
    view.setUint16(offset + 10, dosTime, true);
    view.setUint16(offset + 12, dosDate, true);
    view.setUint32(offset + 14, item.crc32, true);
    view.setUint32(offset + 18, item.data.length, true); // Compressed size
    view.setUint32(offset + 22, item.data.length, true); // Uncompressed size
    view.setUint16(offset + 26, item.nameBytes.length, true); // File name length
    view.setUint16(offset + 28, 0, true); // Extra field length

    offset += 30;
    buffer.set(item.nameBytes, offset);
    offset += item.nameBytes.length;
    buffer.set(item.data, offset);
    offset += item.data.length;
  }

  const centralDirStartOffset = offset;

  // 2. Write Central Directory Headers
  for (const item of prepared) {
    view.setUint32(offset, 0x02014b50, true); // Central file header signature
    view.setUint16(offset + 4, 20, true); // Version made by (2.0)
    view.setUint16(offset + 6, 20, true); // Version needed to extract (2.0)
    view.setUint16(offset + 8, 0x0800, true); // General purpose bit flag (UTF-8)
    view.setUint16(offset + 10, 0, true); // Compression method (0 = Store)
    view.setUint16(offset + 12, dosTime, true);
    view.setUint16(offset + 14, dosDate, true);
    view.setUint32(offset + 16, item.crc32, true);
    view.setUint32(offset + 20, item.data.length, true);
    view.setUint32(offset + 24, item.data.length, true);
    view.setUint16(offset + 28, item.nameBytes.length, true);
    view.setUint16(offset + 30, 0, true); // Extra field length
    view.setUint16(offset + 32, 0, true); // File comment length
    view.setUint16(offset + 34, 0, true); // Disk number start
    view.setUint16(offset + 36, 0, true); // Internal file attributes
    view.setUint32(offset + 38, 0, true); // External file attributes
    view.setUint32(offset + 42, item.localHeaderOffset, true); // Relative offset of local header

    offset += 46;
    buffer.set(item.nameBytes, offset);
    offset += item.nameBytes.length;
  }

  // 3. Write End of Central Directory Record
  view.setUint32(offset, 0x06054b50, true); // End of central dir signature
  view.setUint16(offset + 4, 0, true); // Number of this disk
  view.setUint16(offset + 6, 0, true); // Disk where central directory starts
  view.setUint16(offset + 8, prepared.length, true); // Total entries on this disk
  view.setUint16(offset + 10, prepared.length, true); // Total entries
  view.setUint32(offset + 12, centralDirSize, true); // Size of central directory
  view.setUint32(offset + 16, centralDirStartOffset, true); // Offset of start of central directory
  view.setUint16(offset + 20, 0, true); // Comment length

  return buffer;
}

/**
 * Creates a downloadable Blob of type `application/zip`.
 */
export function createZipBlob(files: ZipFileInput[]): Blob {
  const bytes = createZipArchive(files);
  return new Blob([bytes.buffer as ArrayBuffer], { type: "application/zip" });
}