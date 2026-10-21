import { GlyphCategory } from './types.js';

export const UPM = 1000;
export const DEFAULT_LINE_WIDTH = 44.0;
export const DEFAULT_DEPTH = 50.0;
export const DEFAULT_BEVEL_THICKNESS = 4.0;
export const DEFAULT_BEVEL_SIZE = 3.0;

export const SAFE_NAMES: Record<string, string> = {
  '?': 'question',
  '!': 'exclam',
  '.': 'period',
  ',': 'comma',
  ':': 'colon',
  ';': 'semicolon',
  '"': 'quotedbl',
  "'": 'quotesingle',
  '/': 'slash',
  '\\': 'backslash',
  '@': 'at',
  '#': 'numbersign',
  '%': 'percent',
  '^': 'asciicircum',
  '&': 'ampersand',
  '*': 'asterisk',
  '-': 'hyphen',
  '+': 'plus',
  '=': 'equal'
};

export const CHARACTER_ROWS: string[][] = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'],
  ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'],
  ['n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
  ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  ['!', '?', '.', ',', ':', ';', '"', "'", '/', '\\'],
  ['@', '#', '%', '^', '&', '*', '-', '+', '=']
];

export const ALL_CHARACTERS: string[] = CHARACTER_ROWS.flat();

export function getGlyphCategory(char: string): GlyphCategory {
  if (char >= 'A' && char <= 'Z') return 'uppercase';
  if (char >= 'a' && char <= 'z') return 'lowercase';
  if (char >= '0' && char <= '9') return 'numeral';
  return 'symbol';
}

export function getGlyphSafeName(char: string): string {
  if (char >= 'A' && char <= 'Z') return `upper_${char}`;
  if (char >= 'a' && char <= 'z') return `lower_${char}`;
  if (char >= '0' && char <= '9') return `num_${char}`;
  const safe = SAFE_NAMES[char] || `u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
  return `sym_${safe}`;
}
