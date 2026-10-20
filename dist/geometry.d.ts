import * as THREE from 'three';
import { ExtrudeOptions, MaterialOptions } from './types.js';
export interface ShapeOptions {
    /**
     * Scale factor from 1000 UPM canvas units to 3D world units.
     * Default: 0.01 (so 1000 UPM glyph is ~10 units tall in 3D).
     */
    scale?: number;
    centerOrigin?: boolean;
}
/**
 * Convert 2D vector polygons into an array of THREE.Shape instances with holes attached.
 */
export declare function createThreeShapes(char: string, options?: ShapeOptions): THREE.Shape[];
/**
 * Create an extruded 3D BufferGeometry for a single Triglavian character.
 */
export declare function createTriglavianGeometry(char: string, options?: ExtrudeOptions & ShapeOptions): THREE.BufferGeometry;
/**
 * Create a specialized Triglavian material based on preset and options.
 */
export declare function createTriglavianMaterial(options?: MaterialOptions): THREE.Material;
/**
 * Create a complete 3D Mesh for a Triglavian character.
 */
export declare function createTriglavianMesh(char: string, materialOptions?: MaterialOptions, extrudeOptions?: ExtrudeOptions & ShapeOptions): THREE.Mesh;
/**
 * Create a composed 3D string/group from a sequence of characters.
 */
export declare function createTriglavianTextGroup(text: string, options?: {
    spacing?: number;
    scale?: number;
    materialOptions?: MaterialOptions;
    extrudeOptions?: ExtrudeOptions;
}): THREE.Group;
//# sourceMappingURL=geometry.d.ts.map