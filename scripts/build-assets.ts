import * as fs from 'fs/promises';
import * as path from 'path';
import { ALL_CHARACTERS, getGlyphSafeName } from '../src/constants.js';
import { generateSvg } from '../src/svg.js';
import { createTriglavianMesh } from '../src/geometry.js';
import { exportToGLB, exportToOBJ, exportToSTL } from '../src/exporters.js';
import { generateTypefaceJson } from '../src/typeface.js';

async function main() {
  console.log('⚡ Triglavian Asset Generator starting for 81 graphemes...');
  const startTime = Date.now();

  const distDir = path.resolve('dist');
  const svgDir = path.join(distDir, 'svg');
  const glbDir = path.join(distDir, 'glb');
  const objDir = path.join(distDir, 'obj');
  const stlDir = path.join(distDir, 'stl');

  await Promise.all([
    fs.mkdir(svgDir, { recursive: true }),
    fs.mkdir(glbDir, { recursive: true }),
    fs.mkdir(objDir, { recursive: true }),
    fs.mkdir(stlDir, { recursive: true })
  ]);

  console.log('  [1/4] Exporting 2D SVGs...');
  let svgCount = 0;
  for (const char of ALL_CHARACTERS) {
    const safeName = getGlyphSafeName(char);
    const svgPath = path.join(svgDir, `${safeName}.svg`);
    const svgContent = generateSvg(char);
    await fs.writeFile(svgPath, svgContent, 'utf-8');
    svgCount++;
  }
  console.log(`  ✓ Generated ${svgCount} SVGs in dist/svg/`);

  console.log('  [2/4] Generating Three.js Typeface.json font...');
  const typeface = generateTypefaceJson();
  const typefacePath = path.join(distDir, 'triglavian.typeface.json');
  await fs.writeFile(typefacePath, JSON.stringify(typeface, null, 2), 'utf-8');
  console.log('  ✓ Generated dist/triglavian.typeface.json');

  console.log('  [3/4] Exporting 3D Models (GLB, OBJ, STL)...');
  let meshCount = 0;
  for (const char of ALL_CHARACTERS) {
    const safeName = getGlyphSafeName(char);
    const mesh = createTriglavianMesh(char, { preset: 'obsidian' });

    // GLB
    const glbBuffer = await exportToGLB(mesh);
    await fs.writeFile(path.join(glbDir, `${safeName}.glb`), Buffer.from(glbBuffer));

    // OBJ
    const objStr = exportToOBJ(mesh);
    await fs.writeFile(path.join(objDir, `${safeName}.obj`), objStr, 'utf-8');

    // STL
    const stlStr = exportToSTL(mesh) as string;
    await fs.writeFile(path.join(stlDir, `${safeName}.stl`), stlStr, 'utf-8');

    meshCount++;
  }
  console.log(`  ✓ Exported ${meshCount} characters to GLB, OBJ, and STL!`);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✨ All 2D and 3D assets generated in ${duration}s!`);
}

main().catch(err => {
  console.error('Fatal build error:', err);
  process.exit(1);
});
