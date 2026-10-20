import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLYPHS_DATA } from './glyphs-data.js';
import { DEFAULT_DEPTH, DEFAULT_BEVEL_THICKNESS, DEFAULT_BEVEL_SIZE } from './constants.js';
/**
 * Convert 2D vector polygons into an array of THREE.Shape instances with holes attached.
 */
export function createThreeShapes(char, options = {}) {
    const polys = GLYPHS_DATA[char];
    if (!polys) {
        throw new Error(`Character '${char}' is not defined in Triglavian glyph set.`);
    }
    const scale = options.scale ?? 0.01;
    const shapes = [];
    for (const poly of polys) {
        if (poly.shell.length < 3)
            continue;
        // In SVG Y is down, in Three.js Y is up.
        // Center at (500, 500) and flip Y:
        const shape = new THREE.Shape();
        const [s0x, s0y] = poly.shell[0];
        shape.moveTo((s0x - 500.0) * scale, (500.0 - s0y) * scale);
        for (let i = 1; i < poly.shell.length; i++) {
            const [sx, sy] = poly.shell[i];
            shape.lineTo((sx - 500.0) * scale, (500.0 - sy) * scale);
        }
        shape.closePath();
        // Attach holes
        for (const hole of poly.holes) {
            if (hole.length < 3)
                continue;
            const holePath = new THREE.Path();
            const [h0x, h0y] = hole[0];
            holePath.moveTo((h0x - 500.0) * scale, (500.0 - h0y) * scale);
            for (let i = 1; i < hole.length; i++) {
                const [hx, hy] = hole[i];
                holePath.lineTo((hx - 500.0) * scale, (500.0 - hy) * scale);
            }
            holePath.closePath();
            shape.holes.push(holePath);
        }
        shapes.push(shape);
    }
    return shapes;
}
/**
 * Create an extruded 3D BufferGeometry for a single Triglavian character.
 */
export function createTriglavianGeometry(char, options = {}) {
    const scale = options.scale ?? 0.01;
    const shapes = createThreeShapes(char, { scale });
    if (shapes.length === 0) {
        return new THREE.BufferGeometry();
    }
    const depth = (options.depth ?? DEFAULT_DEPTH) * scale;
    const bevelThickness = (options.bevelThickness ?? DEFAULT_BEVEL_THICKNESS) * scale;
    const bevelSize = (options.bevelSize ?? DEFAULT_BEVEL_SIZE) * scale;
    const extrudeSettings = {
        steps: 1,
        depth: depth,
        bevelEnabled: options.bevelEnabled ?? true,
        bevelThickness: bevelThickness,
        bevelSize: bevelSize,
        bevelOffset: 0,
        bevelSegments: options.bevelSegments ?? 2,
        curveSegments: options.curveSegments ?? 1
    };
    const geometries = shapes.map(shape => new THREE.ExtrudeGeometry(shape, extrudeSettings));
    let merged;
    if (geometries.length === 1) {
        merged = geometries[0];
    }
    else {
        const combined = BufferGeometryUtils.mergeGeometries(geometries, false);
        if (!combined) {
            throw new Error(`Failed to merge geometries for character '${char}'.`);
        }
        merged = combined;
    }
    merged.computeVertexNormals();
    return merged;
}
/**
 * Create a specialized Triglavian material based on preset and options.
 */
export function createTriglavianMaterial(options = {}) {
    const preset = options.preset ?? 'obsidian';
    if (preset === 'plasma') {
        return new THREE.MeshStandardMaterial({
            color: options.color ?? 0xff1e42,
            emissive: options.emissive ?? 0xff2b00,
            emissiveIntensity: options.emissiveIntensity ?? 1.5,
            roughness: options.roughness ?? 0.2,
            metalness: options.metalness ?? 0.8,
            wireframe: options.wireframe ?? false
        });
    }
    if (preset === 'gold') {
        return new THREE.MeshStandardMaterial({
            color: options.color ?? 0xd4af37,
            emissive: options.emissive ?? 0x221100,
            emissiveIntensity: options.emissiveIntensity ?? 0.2,
            roughness: options.roughness ?? 0.3,
            metalness: options.metalness ?? 0.9,
            wireframe: options.wireframe ?? false
        });
    }
    if (preset === 'wireframe') {
        return new THREE.MeshBasicMaterial({
            color: options.color ?? 0xff3b52,
            wireframe: true
        });
    }
    if (preset === 'titanium') {
        return new THREE.MeshStandardMaterial({
            color: options.color ?? 0x8a929a,
            emissive: options.emissive ?? 0x05080c,
            roughness: options.roughness ?? 0.4,
            metalness: options.metalness ?? 0.85,
            wireframe: options.wireframe ?? false
        });
    }
    // Default 'obsidian' (Triglavian collective black hull with crimson accent)
    return new THREE.MeshStandardMaterial({
        color: options.color ?? 0x121417,
        emissive: options.emissive ?? 0x1c0608,
        emissiveIntensity: options.emissiveIntensity ?? 0.3,
        roughness: options.roughness ?? 0.35,
        metalness: options.metalness ?? 0.9,
        wireframe: options.wireframe ?? false
    });
}
/**
 * Create a complete 3D Mesh for a Triglavian character.
 */
export function createTriglavianMesh(char, materialOptions = {}, extrudeOptions = {}) {
    const geometry = createTriglavianGeometry(char, extrudeOptions);
    const material = createTriglavianMaterial(materialOptions);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = `Triglavian_${char}`;
    return mesh;
}
/**
 * Create a composed 3D string/group from a sequence of characters.
 */
export function createTriglavianTextGroup(text, options = {}) {
    const group = new THREE.Group();
    const scale = options.scale ?? 0.01;
    const spacing = options.spacing ?? 7.0; // world units between character centers
    let cursorX = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === ' ') {
            cursorX += spacing * 0.6;
            continue;
        }
        if (GLYPHS_DATA[char]) {
            const mesh = createTriglavianMesh(char, options.materialOptions, {
                ...options.extrudeOptions,
                scale
            });
            mesh.position.x = cursorX;
            group.add(mesh);
        }
        cursorX += spacing;
    }
    // Center group along X
    const totalWidth = cursorX - spacing;
    group.position.x = -totalWidth / 2.0;
    return group;
}
//# sourceMappingURL=geometry.js.map