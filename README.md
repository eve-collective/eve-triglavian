# Triglavian Collective Typography & 3D Geometry Toolkit

🌐 **Live Web Studio:** [https://eve-collective.github.io/eve-triglavian](https://eve-collective.github.io/eve-triglavian)

A modern **TypeScript** and **Three.js** computational geometry library, 2D vector asset generator, and interactive 3D Web Visualizer for the **Triglavian Collective** script from _EVE Online_.

Derived directly from the canonical OpenType font specimen (`dist/triglavian.otf`) used by CCP to produce the historical grapheme decoding chart (`triglavian_grapheme_samples // crossreference TD-1`) by the **Arataka Research Consortium (ARC)**.

---

## ✨ Features & Architecture

Built as a **computational geometry, 2D vector, and 3D modeling engine**:

- **Exact Canonical Geometry:** All 81 characters are represented as clean, closed, non-self-intersecting 2D polygons with outer shells and interior holes.
- **Identical Stroke & Depth:** Every character shares the same canonical stroke width ($44\text{ UPM}$ on a $1000\text{ UPM}$ coordinate system) and uniform extrusion depth ($50\text{ UPM}$).
- **Multi-Format 2D & 3D Exports:**
  - **SVG (`dist/svg/`):** 81 lightweight, resolution-independent vector glyphs with `evenodd` winding.
  - **Binary glTF (`dist/glb/`):** 81 ready-to-render 3D models with pre-computed vertex normals and PBR materials.
  - **Wavefront OBJ (`dist/obj/`):** 81 universal polygon meshes for Blender, Maya, Unity, Unreal Engine, and WebGL.
  - **Stereolithography (`dist/stl/`):** 81 watertight solids optimized for **3D printing** and physical fabrication.
  - **Three.js Typeface (`dist/triglavian.typeface.json`):** Full JSON font for native Three.js `FontLoader` and `TextGeometry`.
- **Procedural Three.js Engine:** Programmatically generate meshes, extrusions, custom bevels, and multi-character composed 3D text strings in real time.
- **Interactive 3D Web Visualizer Studio:** A rich dark-mode WebGL application featuring real-time orbital controls, material shaders (*Obsidian*, *Plasma*, *Titanium*, *Gold*, *Wireframe*), live text composition, and one-click asset downloads.

---

## 📐 The Triglavian Script Geometry

The Triglavian script is constructed on an **isometric / equilateral triangular lattice** where all stroke angles are multiples of $60^\circ$ ($0^\circ$, $60^\circ$, $120^\circ$).

- **Bounding Box:** $1000 \times 1000\text{ UPM}$ (Units Per Em).
- **Equilateral Height Ratio:** $\Delta h = \frac{\sqrt{3}}{2} \cdot s \approx 0.866 \cdot s$.
- **81 Total Graphemes:**
  - **26 Uppercase Letters (`A`–`Z`):** Primary apex triangles ($\Delta$), inverted frames ($\nabla$), and complex bipartite zigzags with nested sub-triangles.
  - **26 Lowercase Letters (`a`–`z`):** Minimalist reductions featuring open bounding frames and offset diacritic ticks.
  - **10 Numerals (`0`–`9`):** Axisymmetric along the vertical centerline ($x = 500$), transitioning from simple frames to nested rhombi.
  - **19 Punctuation & Symbols:** Mathematical operators, brackets, and half-scale triangular marks.

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/eve-collective/eve-triglavian.git
cd eve-triglavian

# Install dependencies (Node.js 18+ with pnpm)
pnpm install
```

### 3D Web Visualizer Studio

- **Live Web Application:** [https://eve-collective.github.io/eve-triglavian](https://eve-collective.github.io/eve-triglavian)
- **Local Development:** Run the interactive local studio with hot module reloading:

```bash
pnpm dev
```

Open `http://localhost:3000` to inspect any character in 3D, customize extrusion depth and bevels, preview material presets, compose custom sentences, and export assets.

---

## 💻 Programmatic Usage (TypeScript / JavaScript)

The library provides native Three.js objects, pure SVG generators, and multi-format exporters:

```typescript
import * as THREE from 'three';
import {
  createTriglavianMesh,
  createTriglavianTextGroup,
  generateSvg,
  exportToGLB,
  exportToOBJ,
  exportToSTL
} from 'eve-triglavian';

// 1. Create a 3D Mesh for a single character
const mesh = createTriglavianMesh('A', {
  depth: 60,
  bevelThickness: 3,
  bevelSize: 2,
  materialPreset: 'plasma' // 'obsidian' | 'plasma' | 'titanium' | 'gold' | 'wireframe'
});
scene.add(mesh);

// 2. Compose a 3D text string with auto-spacing and centering
const textGroup = createTriglavianTextGroup('KYBERNAUT', {
  spacing: 220,
  scale: 0.002,
  depth: 50,
  materialPreset: 'obsidian'
});
scene.add(textGroup);

// 3. Generate standalone SVG markup
const svgXml = generateSvg('Z', { fill: '#FF2244', width: 512, height: 512 });

// 4. Headless 3D Exporting (Node.js or Browser)
const glbBuffer = await exportToGLB(mesh);
const objText = exportToOBJ(mesh);
const stlText = exportToSTL(mesh);
```

### Using with Three.js `FontLoader` & `TextGeometry`

The bundled `dist/triglavian.typeface.json` works directly with standard Three.js text rendering:

```typescript
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

const loader = new FontLoader();
loader.load('./dist/triglavian.typeface.json', (font) => {
  const geometry = new TextGeometry('TRIGLAV', {
    font: font,
    size: 80,
    depth: 20,
    curveSegments: 1,
    bevelEnabled: false
  });
  const textMesh = new THREE.Mesh(geometry, material);
  scene.add(textMesh);
});
```

---

## 🛠️ CLI Tooling

The package includes a command-line interface executable via `pnpm exec` or `npx`:

```bash
# Rebuild all 81 SVGs, GLB, OBJ, STL models, and Typeface JSON into dist/
pnpm build:assets
# Or via CLI directly:
pnpm exec eve-triglavian build

# Print SVG markup for any character
pnpm exec eve-triglavian svg A

# Show library metrics and character inventory
pnpm exec eve-triglavian info
```

---

## 📁 Repository Structure

```text
eve-triglavian/
├── bin/
│   └── cli.js                     # Global executable CLI (npx eve-triglavian)
├── dist/                          # Canonical compiled 2D & 3D asset distribution
│   ├── triglavian.otf             # Authoritative OpenType font specimen
│   ├── svg/                       # 81 standalone vector SVGs (lower_*, upper_*, num_*, sym_*)
│   ├── glb/                       # 81 binary glTF 3D models with PBR materials
│   ├── obj/                       # 81 Wavefront OBJ polygon meshes
│   ├── stl/                       # 81 Stereolithography 3D print meshes
│   └── triglavian.typeface.json   # Three.js FontLoader typeface definition
├── index.html                     # 3D Web Visualizer studio HTML entry
├── package.json                   # NPM package definition, scripts, and exports
├── pnpm-lock.yaml                 # Pnpm lockfile
├── scripts/
│   └── build-assets.ts            # High-speed batch asset generator
├── src/
│   ├── types.ts                   # TypeScript interfaces (PolygonDef, MaterialOptions, etc.)
│   ├── constants.ts               # Glyph categories, metric constants, safe filenames
│   ├── glyphs-data.ts             # Canonical polygon coordinate dataset for all 81 glyphs
│   ├── svg.ts                     # SVG path & XML generation engine
│   ├── geometry.ts                # Three.js Shape, ExtrudeGeometry, & TextGroup generator
│   ├── typeface.ts                # Three.js Typeface.json generator
│   ├── exporters.ts               # Universal 3D exporters (GLB, OBJ, STL)
│   ├── index.ts                   # Public library entry point
│   └── web/                       # Interactive 3D Web Visualizer application
│       ├── main.ts                # Three.js scene, lighting, controls, and UI bindings
│       └── style.css              # Dark-mode Abyssal Deadspace styling
├── tests/
│   └── triglavian.test.ts         # Vitest test suite (13 tests)
├── tsconfig.json                  # TypeScript workspace configuration
├── tsconfig.lib.json              # TypeScript library compiler configuration
└── vite.config.ts                 # Vite development and bundle configuration
```

---

## 🧪 Testing & Validation

Run the Vitest automated test suite:

```bash
pnpm test
```

The test suite validates:
- Character set completeness (81 canonical glyphs across 7 categories)
- Deterministic filesystem-safe naming conventions
- SVG validity, path attributes, and winding rules
- Three.js procedural `Shape` hole attachment and containment
- `BufferGeometry` extrusion, face normal orientation, and bounding boxes
- PBR material preset application and 3D text group composition
- Headless binary GLB, OBJ, and STL exporter integrity

---

## 🪙 Donations & Support

This project is free and open-source software built for the *EVE Online* community. In-kind or ISK donations are warmly welcomed to support ongoing open-source tool development:
- **In-Game Donations (ISK / Assets):** Send to the **`EVE-Collective`** corporation in *EVE Online*.

---

## 🙏 Credits & Acknowledgments

- **Arataka Research Consortium (ARC):** Deep appreciation to the Arataka Research Consortium for their monumental in-game cryptographic analysis, grapheme decoding, and documentation (`triglavian_grapheme_samples // crossreference TD-1`). Their work established the canonical foundation for Triglavian research across New Eden.

---

## ⚖️ Legal Disclaimer

All _EVE Online_ materials, Triglavian emblems, graphemes, lore, and related intellectual property are the property of **Fenris Corporation** and **CCP hf.**

This repository is an unofficial, non-commercial community research and typography reconstruction project created for educational, analytical, and artistic purposes under fair-use principles. No endorsement by or affiliation with Fenris Corporation or CCP hf. is implied.

---

## 📄 License

Distributed under the [MIT License](LICENSE).
