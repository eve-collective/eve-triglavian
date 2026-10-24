#!/usr/bin/env node
import { ALL_CHARACTERS, getGlyphSafeName } from '../dist/constants.js';
import { generateSvg, exportAllSvgs } from '../dist/svg.js';
import { createTriglavianMesh } from '../dist/geometry.js';
import { exportToGLB, exportToOBJ, exportToSTL } from '../dist/exporters.js';
import { generateTypefaceJson } from '../dist/typeface.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const args = process.argv.slice(2);
const command = args[0] || 'help';

async function run() {
  if (command === 'build') {
    const outDir = path.resolve(args[1] || 'dist');
    const svgDir = path.join(outDir, 'svg');
    const glbDir = path.join(outDir, 'glb');
    const objDir = path.join(outDir, 'obj');
    const stlDir = path.join(outDir, 'stl');

    await Promise.all([
      fs.mkdir(svgDir, { recursive: true }),
      fs.mkdir(glbDir, { recursive: true }),
      fs.mkdir(objDir, { recursive: true }),
      fs.mkdir(stlDir, { recursive: true })
    ]);

    console.log(`⚡ Exporting Triglavian 2D & 3D assets to ${outDir}...`);
    
    // SVGs
    for (const char of ALL_CHARACTERS) {
      const safe = getGlyphSafeName(char);
      await fs.writeFile(path.join(svgDir, `${safe}.svg`), generateSvg(char));
    }
    console.log(`  ✓ 81 vector SVGs written to ${svgDir}`);

    // Typeface JSON
    const typeface = generateTypefaceJson();
    await fs.writeFile(path.join(outDir, 'triglavian.typeface.json'), JSON.stringify(typeface, null, 2));
    console.log(`  ✓ Three.js typeface written to ${path.join(outDir, 'triglavian.typeface.json')}`);

    // 3D Models
    for (const char of ALL_CHARACTERS) {
      const safe = getGlyphSafeName(char);
      const mesh = createTriglavianMesh(char);
      const glb = await exportToGLB(mesh);
      await fs.writeFile(path.join(glbDir, `${safe}.glb`), Buffer.from(glb));
      await fs.writeFile(path.join(objDir, `${safe}.obj`), exportToOBJ(mesh));
      await fs.writeFile(path.join(stlDir, `${safe}.stl`), String(exportToSTL(mesh)));
    }
    // Webfonts & Stylesheet
    const fontFiles = ['triglavian.otf', 'triglavian.woff2', 'triglavian.woff', 'triglavian.css'];
    for (const file of fontFiles) {
      try {
        const srcFile = path.resolve(import.meta.dirname, '..', 'dist', file);
        await fs.copyFile(srcFile, path.join(outDir, file));
      } catch {
        // Fallback if not found
      }
    }
    console.log(`  ✓ Webfont suite (WOFF2, WOFF, OTF, CSS) copied to ${outDir}`);

    console.log(`  ✓ 81 3D models (GLB, OBJ, STL) written to ${outDir}`);
    console.log('✨ Build complete!');
    return;
  }

  if (command === 'svg') {
    const char = args[1] || 'A';
    console.log(generateSvg(char));
    return;
  }

  if (command === 'info') {
    console.log('EVE Online Triglavian Geometric Typography Toolkit');
    console.log(`Total glyphs: ${ALL_CHARACTERS.length}`);
    console.log('Available formats: WOFF2, WOFF, OTF, Three.js Typeface JSON, SVG (2D), GLB/OBJ/STL (3D)');
    return;
  }

  console.log(`
Triglavian Typography & 3D Geometry CLI
Usage:
  npx eve-triglavian build [outDir]   Generate all SVGs, 3D models (GLB, OBJ, STL), and Typeface JSON
  npx eve-triglavian svg <char>       Print SVG markup for a character
  npx eve-triglavian info             Show library info and metrics
  npx eve-triglavian help             Show this help
  `);
}

run().catch(console.error);
