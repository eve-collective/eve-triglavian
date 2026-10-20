export type Point2D = [number, number];
export interface PolygonDef {
    shell: Point2D[];
    holes: Point2D[][];
}
export type GlyphCategory = 'uppercase' | 'lowercase' | 'numeral' | 'symbol';
export interface GlyphInfo {
    character: string;
    category: GlyphCategory;
    unicodeHex: string;
    safeName: string;
    strokeCount: number;
}
export interface ExtrudeOptions {
    depth?: number;
    bevelEnabled?: boolean;
    bevelThickness?: number;
    bevelSize?: number;
    bevelSegments?: number;
    curveSegments?: number;
}
export type MaterialPreset = 'obsidian' | 'plasma' | 'wireframe' | 'gold' | 'titanium';
export interface MaterialOptions {
    preset?: MaterialPreset;
    color?: number | string;
    emissive?: number | string;
    emissiveIntensity?: number;
    roughness?: number;
    metalness?: number;
    wireframe?: boolean;
}
//# sourceMappingURL=types.d.ts.map