import { GLYPHS_DATA } from './glyphs-data.js';

export interface SvgOptions {
  fill?: string;
  viewBox?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}

/**
 * Generate an SVG path `d` attribute string for a given character.
 */
export function generateSvgPath(char: string): string {
  const polys = GLYPHS_DATA[char];
  if (!polys) {
    throw new Error(`Character '${char}' is not defined in Triglavian glyph set.`);
  }

  const pathParts: string[] = [];

  for (const poly of polys) {
    // Shell
    if (poly.shell.length >= 3) {
      const shellCommands = poly.shell.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt[0]},${pt[1]}`);
      pathParts.push(`${shellCommands.join(' ')} Z`);
    }

    // Holes
    for (const hole of poly.holes) {
      if (hole.length >= 3) {
        const holeCommands = hole.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt[0]},${pt[1]}`);
        pathParts.push(`${holeCommands.join(' ')} Z`);
      }
    }
  }

  return pathParts.join(' ');
}

/**
 * Generate full SVG document string for a single character.
 */
export function generateSvg(char: string, options: SvgOptions = {}): string {
  const fill = options.fill ?? '#FFFFFF';
  const viewBox = options.viewBox ?? '0 0 1000 1000';
  const width = options.width ?? '100%';
  const height = options.height ?? '100%';
  const className = options.className ? ` class="${options.className}"` : '';

  const pathD = generateSvgPath(char);
  const unicodeHex = `U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}"${className}>`,
    `  <!-- Triglavian Glyph: ${char} (${unicodeHex}) -->`,
    `  <path d="${pathD}" fill="${fill}" fill-rule="evenodd" />`,
    '</svg>'
  ].join('\n');
}

/**
 * Generate SVGs for all supported Triglavian characters.
 */
export function exportAllSvgs(options: SvgOptions = {}): Record<string, string> {
  const result: Record<string, string> = {};
  for (const char of Object.keys(GLYPHS_DATA)) {
    result[char] = generateSvg(char, options);
  }
  return result;
}

export interface TextSvgOptions extends SvgOptions {
  letterSpacing?: number;
  lineHeight?: number;
  padding?: number;
}

/**
 * Generate a composed multi-character / multi-line SVG vector document.
 */
export function generateTextSvg(text: string, options: TextSvgOptions = {}): string {
  const fill = options.fill ?? '#FF1E38';
  const letterSpacing = options.letterSpacing ?? 100;
  const lineHeight = options.lineHeight ?? 1100;
  const padding = options.padding ?? 100;

  const lines = text.split('\n');
  let maxLineWidth = 0;
  const renderedGlyphs: { x: number; y: number; pathD: string }[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    let cursorX = padding;
    const cursorY = padding + lineIndex * lineHeight;

    for (const char of line) {
      if (char === ' ') {
        cursorX += 600 + letterSpacing;
        continue;
      }
      if (GLYPHS_DATA[char]) {
        const pathD = generateSvgPath(char);
        renderedGlyphs.push({
          x: cursorX,
          y: cursorY,
          pathD
        });
        cursorX += 1000 + letterSpacing;
      }
    }
    if (cursorX > maxLineWidth) {
      maxLineWidth = cursorX;
    }
  }

  const totalWidth = Math.max(maxLineWidth + padding, 1000);
  const totalHeight = padding * 2 + Math.max(lines.length, 1) * lineHeight;

  const glyphMarkup = renderedGlyphs.map(
    item => `  <g transform="translate(${item.x}, ${item.y})">\n    <path d="${item.pathD}" fill="${fill}" fill-rule="evenodd" />\n  </g>`
  );

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">`,
    `  <!-- Triglavian Composed Text Specimen -->`,
    ...glyphMarkup,
    `</svg>`
  ].join('\n');
}
