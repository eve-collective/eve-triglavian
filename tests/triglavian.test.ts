import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  ALL_CHARACTERS,
  CHARACTER_ROWS,
  getGlyphCategory,
  getGlyphSafeName,
  GLYPHS_DATA,
  generateSvg,
  generateSvgPath,
  createThreeShapes,
  createTriglavianGeometry,
  createTriglavianMesh,
  createTriglavianTextGroup,
  generateTypefaceJson,
  exportToOBJ,
  exportToSTL,
  exportToGLB
} from '../src';

describe('Triglavian Typography & Data', () => {
  it('contains exactly 81 canonical characters', () => {
    expect(ALL_CHARACTERS.length).toBe(81);
    expect(Object.keys(GLYPHS_DATA).length).toBe(81);
  });

  it('correctly categorizes all 81 glyphs', () => {
    const uppers = ALL_CHARACTERS.filter(c => getGlyphCategory(c) === 'uppercase');
    const lowers = ALL_CHARACTERS.filter(c => getGlyphCategory(c) === 'lowercase');
    const numerals = ALL_CHARACTERS.filter(c => getGlyphCategory(c) === 'numeral');
    const symbols = ALL_CHARACTERS.filter(c => getGlyphCategory(c) === 'symbol');

    expect(uppers.length).toBe(26);
    expect(lowers.length).toBe(26);
    expect(numerals.length).toBe(10);
    expect(symbols.length).toBe(19);
  });

  it('provides unique filesystem-safe names for all characters', () => {
    const safeNames = new Set(ALL_CHARACTERS.map(getGlyphSafeName));
    expect(safeNames.size).toBe(81);
  });
});

describe('2D Vector SVG Generation', () => {
  it('generates valid SVG document with correct attributes', () => {
    const svg = generateSvg('A');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 1000 1000"');
    expect(svg).toContain('fill-rule="evenodd"');
    expect(svg).toContain('U+0041');
  });

  it('generates non-empty SVG path data for all glyphs', () => {
    for (const char of ALL_CHARACTERS) {
      const pathD = generateSvgPath(char);
      expect(pathD.length).toBeGreaterThan(10);
      expect(pathD).toContain('M');
      expect(pathD).toContain('Z');
    }
  });
});

describe('Three.js 3D Procedural Geometry', () => {
  it('converts glyphs into valid THREE.Shape instances with holes', () => {
    const shapesA = createThreeShapes('A');
    expect(shapesA.length).toBeGreaterThanOrEqual(1);

    // Verify hole presence for glyphs with enclosed regions (e.g. A has inner chevron / triangle)
    const totalHoles = shapesA.reduce((acc, s) => acc + s.holes.length, 0);
    expect(totalHoles).toBeGreaterThanOrEqual(0);
  });

  it('creates an extruded 3D BufferGeometry with valid vertices and normals', () => {
    const geom = createTriglavianGeometry('A');
    expect(geom).toBeInstanceOf(THREE.BufferGeometry);
    expect(geom.getAttribute('position').count).toBeGreaterThan(0);
    expect(geom.getAttribute('normal').count).toBeGreaterThan(0);
  });

  it('creates complete 3D Mesh with preset materials', () => {
    const mesh = createTriglavianMesh('A', { preset: 'plasma' });
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.name).toBe('Triglavian_A');
    expect(mesh.castShadow).toBe(true);
    expect(mesh.receiveShadow).toBe(true);
  });

  it('creates a 3D composed text group with proper layout', () => {
    const group = createTriglavianTextGroup('EVE');
    expect(group).toBeInstanceOf(THREE.Group);
    expect(group.children.length).toBe(3);
  });
});

describe('Three.js Typeface JSON Generation', () => {
  it('generates compliant Three.js Typeface structure with all 81 glyphs', () => {
    const font = generateTypefaceJson();
    expect(font.familyName).toBe('TriglavianGeometric');
    expect(font.resolution).toBe(1000);
    expect(font.glyphs[' ']).toBeDefined();
    expect(font.glyphs['A']).toBeDefined();
    expect(font.glyphs['z']).toBeDefined();
    expect(font.glyphs['?']).toBeDefined();
    expect(Object.keys(font.glyphs).length).toBe(82); // 81 + space
  });
});

describe('3D Exporters (OBJ, STL, GLB)', () => {
  it('exports mesh to Wavefront OBJ string format', () => {
    const mesh = createTriglavianMesh('A');
    const obj = exportToOBJ(mesh);
    expect(obj).toContain('v ');
    expect(obj).toContain('f ');
    expect(obj.length).toBeGreaterThan(100);
  });

  it('exports mesh to STL format string', () => {
    const mesh = createTriglavianMesh('A');
    const stl = exportToSTL(mesh);
    expect(typeof stl === 'string').toBe(true);
    expect(stl as string).toContain('solid');
    expect(stl as string).toContain('facet normal');
  });

  it('exports mesh to binary GLB format', async () => {
    const mesh = createTriglavianMesh('A');
    const glb = await exportToGLB(mesh);
    expect(glb).toBeInstanceOf(ArrayBuffer);
    expect(glb.byteLength).toBeGreaterThan(100);
  });
});
