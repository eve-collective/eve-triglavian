import * as zlib from 'zlib';
import wawoff2 from 'wawoff2';

/**
 * Converts OpenType / TrueType font buffer into WOFF2 format using Brotli compression (via wawoff2).
 */
export async function convertOtfToWoff2(otfBuffer: Buffer): Promise<Buffer> {
  const woff2Uint8 = await wawoff2.compress(otfBuffer);
  return Buffer.from(woff2Uint8);
}

/**
 * Converts OpenType / TrueType font buffer into standard WOFF 1.0 format.
 * Follows the W3C WOFF 1.0 specification with zlib deflate compression.
 */
export function convertOtfToWoff(otfBuffer: Buffer): Buffer {
  const flavor = otfBuffer.readUInt32BE(0);
  const numTables = otfBuffer.readUInt16BE(4);
  const headerLen = 44;
  const dirLen = numTables * 20;

  let currentOffset = headerLen + dirLen;
  const tableEntries: Array<{
    tag: Buffer;
    offset: number;
    compLength: number;
    origLength: number;
    origChecksum: number;
  }> = [];
  const tableDataBlocks: Buffer[] = [];

  for (let i = 0; i < numTables; i++) {
    const entryOffset = 12 + i * 16;
    const tag = otfBuffer.subarray(entryOffset, entryOffset + 4);
    const checksum = otfBuffer.readUInt32BE(entryOffset + 4);
    const offset = otfBuffer.readUInt32BE(entryOffset + 8);
    const length = otfBuffer.readUInt32BE(entryOffset + 12);

    const tableData = otfBuffer.subarray(offset, offset + length);
    const compressed = zlib.deflateSync(tableData, { level: 9 });
    const useComp = compressed.length < length;
    const dataToUse = useComp ? compressed : tableData;
    const compLength = dataToUse.length;

    // Pad to 4-byte boundary
    const pad = (4 - (compLength % 4)) % 4;
    const paddedData = Buffer.concat([dataToUse, Buffer.alloc(pad)]);

    tableEntries.push({
      tag,
      offset: currentOffset,
      compLength,
      origLength: length,
      origChecksum: checksum
    });
    tableDataBlocks.push(paddedData);
    currentOffset += paddedData.length;
  }

  const woffHeader = Buffer.alloc(44);
  woffHeader.write('wOFF', 0, 4, 'ascii');
  woffHeader.writeUInt32BE(flavor, 4);
  woffHeader.writeUInt32BE(currentOffset, 8); // total file length
  woffHeader.writeUInt16BE(numTables, 12);
  woffHeader.writeUInt16BE(0, 14); // reserved
  woffHeader.writeUInt32BE(otfBuffer.length, 16); // totalSfntSize
  woffHeader.writeUInt16BE(1, 20); // majorVersion
  woffHeader.writeUInt16BE(0, 22); // minorVersion
  woffHeader.writeUInt32BE(0, 24); // metaOffset
  woffHeader.writeUInt32BE(0, 28); // metaLength
  woffHeader.writeUInt32BE(0, 32); // metaOrigLength
  woffHeader.writeUInt32BE(0, 36); // privOffset
  woffHeader.writeUInt32BE(0, 40); // privLength

  const dirBuffer = Buffer.alloc(dirLen);
  for (let i = 0; i < numTables; i++) {
    const e = tableEntries[i];
    const off = i * 20;
    e.tag.copy(dirBuffer, off);
    dirBuffer.writeUInt32BE(e.offset, off + 4);
    dirBuffer.writeUInt32BE(e.compLength, off + 8);
    dirBuffer.writeUInt32BE(e.origLength, off + 12);
    dirBuffer.writeUInt32BE(e.origChecksum, off + 16);
  }

  return Buffer.concat([woffHeader, dirBuffer, ...tableDataBlocks]);
}

/**
 * Generates standard webfont CSS stylesheet containing @font-face and utility classes.
 */
export function generateFontCss(fontPathPrefix = '.'): string {
  const prefix = fontPathPrefix.replace(/\/+$/, '');
  return `/**
 * EVE Online Triglavian Collective Script
 * Canonical OpenType & WebFont Distribution (WOFF2, WOFF, OTF)
 * Repository: https://github.com/eve-collective/eve-triglavian
 * License: MIT
 */

@font-face {
  font-family: 'Triglavian';
  src: url('${prefix}/triglavian.woff2') format('woff2'),
       url('${prefix}/triglavian.woff') format('woff'),
       url('${prefix}/triglavian.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

.triglavian-font,
.triglavian-text,
.font-triglavian {
  font-family: 'Triglavian', -apple-system, sans-serif;
  font-weight: normal;
  font-style: normal;
}
`;
}
