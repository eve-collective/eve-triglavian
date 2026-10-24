import { describe, it, expect } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { convertOtfToWoff2, convertOtfToWoff, generateFontCss } from '../scripts/font-utils';

describe('Webfont Generation & Formats', () => {
  it('converts OTF to WOFF2 with valid wOF2 signature and size reduction', async () => {
    const otfBuffer = await fs.readFile(path.resolve('dist/triglavian.otf'));
    const woff2Buffer = await convertOtfToWoff2(otfBuffer);

    expect(woff2Buffer.length).toBeGreaterThan(0);
    // WOFF2 header starts with magic 'wOF2' (0x774F4632)
    expect(woff2Buffer.subarray(0, 4).toString('ascii')).toBe('wOF2');
    // Significant compression over OTF (6.7 KB vs 14 KB)
    expect(woff2Buffer.length).toBeLessThan(otfBuffer.length * 0.6);
  });

  it('converts OTF to compliant WOFF 1.0 with valid wOFF signature', async () => {
    const otfBuffer = await fs.readFile(path.resolve('dist/triglavian.otf'));
    const woffBuffer = convertOtfToWoff(otfBuffer);

    expect(woffBuffer.length).toBeGreaterThan(0);
    // WOFF header starts with magic 'wOFF' (0x774F4646)
    expect(woffBuffer.subarray(0, 4).toString('ascii')).toBe('wOFF');
    // Deflate compression over OTF
    expect(woffBuffer.length).toBeLessThan(otfBuffer.length);
  });

  it('generates standard @font-face CSS stylesheet with utility classes', () => {
    const css = generateFontCss('.');
    expect(css).toContain("@font-face");
    expect(css).toContain("font-family: 'Triglavian'");
    expect(css).toContain("format('woff2')");
    expect(css).toContain("format('woff')");
    expect(css).toContain("format('opentype')");
    expect(css).toContain(".triglavian-font");
    expect(css).toContain(".triglavian-text");
  });

  it('ensures all production font assets exist in both dist/ and public/', async () => {
    const checkFiles = [
      'triglavian.otf',
      'triglavian.woff2',
      'triglavian.woff',
      'triglavian.css',
      'triglavian.typeface.json'
    ];

    for (const file of checkFiles) {
      const distStat = await fs.stat(path.resolve('dist', file));
      const publicStat = await fs.stat(path.resolve('public', file));

      expect(distStat.size).toBeGreaterThan(0);
      expect(publicStat.size).toBeGreaterThan(0);
      expect(distStat.size).toBe(publicStat.size);
    }
  });
});
