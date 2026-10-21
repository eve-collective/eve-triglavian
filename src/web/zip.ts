/**
 * Minimal zero-dependency ZIP archive builder for browser downloads.
 * Generates uncompressed (store) ZIP archives compatible with standard unpackers.
 */

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[i] = c;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipFileEntry {
  filename: string;
  data: string | Uint8Array;
}

export function createZipArchive(files: ZipFileEntry[]): Blob {
  const fileRecords: {
    filenameBytes: Uint8Array;
    dataBytes: Uint8Array;
    crc: number;
    offset: number;
  }[] = [];

  const chunks: Uint8Array[] = [];
  let currentOffset = 0;
  const encoder = new TextEncoder();

  for (const file of files) {
    const filenameBytes = encoder.encode(file.filename);
    const dataBytes = typeof file.data === 'string' ? encoder.encode(file.data) : file.data;
    const fileCrc = crc32(dataBytes);

    // Local file header (30 bytes + filename)
    const header = new Uint8Array(30 + filenameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint32(14, fileCrc, true);
    view.setUint32(18, dataBytes.length, true);
    view.setUint32(22, dataBytes.length, true);
    view.setUint16(26, filenameBytes.length, true);
    view.setUint16(28, 0, true);
    header.set(filenameBytes, 30);

    chunks.push(header, dataBytes);
    fileRecords.push({
      filenameBytes,
      dataBytes,
      crc: fileCrc,
      offset: currentOffset
    });
    currentOffset += header.length + dataBytes.length;
  }

  // Central directory
  const centralDirStart = currentOffset;
  let centralDirSize = 0;

  for (const rec of fileRecords) {
    const cdHeader = new Uint8Array(46 + rec.filenameBytes.length);
    const view = new DataView(cdHeader.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint16(14, 0, true);
    view.setUint32(16, rec.crc, true);
    view.setUint32(20, rec.dataBytes.length, true);
    view.setUint32(24, rec.dataBytes.length, true);
    view.setUint16(28, rec.filenameBytes.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, rec.offset, true);
    cdHeader.set(rec.filenameBytes, 46);

    chunks.push(cdHeader);
    centralDirSize += cdHeader.length;
    currentOffset += cdHeader.length;
  }

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const view = new DataView(eocd.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, fileRecords.length, true);
  view.setUint16(10, fileRecords.length, true);
  view.setUint32(12, centralDirSize, true);
  view.setUint32(16, centralDirStart, true);
  view.setUint16(20, 0, true);
  chunks.push(eocd);

  return new Blob(chunks as any[], { type: 'application/zip' });
}
