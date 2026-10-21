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
export declare function generateSvgPath(char: string): string;
/**
 * Generate full SVG document string for a single character.
 */
export declare function generateSvg(char: string, options?: SvgOptions): string;
/**
 * Generate SVGs for all supported Triglavian characters.
 */
export declare function exportAllSvgs(options?: SvgOptions): Record<string, string>;
export interface TextSvgOptions extends SvgOptions {
    letterSpacing?: number;
    lineHeight?: number;
    padding?: number;
}
/**
 * Generate a composed multi-character / multi-line SVG vector document.
 */
export declare function generateTextSvg(text: string, options?: TextSvgOptions): string;
//# sourceMappingURL=svg.d.ts.map