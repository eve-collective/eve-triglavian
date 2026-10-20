export interface TypefaceGlyph {
    ha: number;
    x_min: number;
    x_max: number;
    o: string;
}
export interface TypefaceFont {
    glyphs: Record<string, TypefaceGlyph>;
    familyName: string;
    ascender: number;
    descender: number;
    underlinePosition: number;
    underlineThickness: number;
    boundingBox: {
        yMin: number;
        xMin: number;
        yMax: number;
        xMax: number;
    };
    resolution: number;
    original_font_information: {
        format: string;
        copyright: string;
    };
}
/**
 * Generate a standard Three.js Typeface.json representation of the Triglavian font.
 * This JSON can be loaded directly by Three.js `FontLoader` to use with `TextGeometry`.
 */
export declare function generateTypefaceJson(familyName?: string): TypefaceFont;
//# sourceMappingURL=typeface.d.ts.map