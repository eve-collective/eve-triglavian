# Triglavian Collective Typography & Geometric Font Generator

A programmatic typography toolkit and vector specimen library for the **Triglavian Collective** character set from _EVE Online_, based on the grapheme decoding sheets (`triglavian_grapheme_samples // crossreference TD-1`) compiled by the **Arataka Research Consortium (ARC)**.

This repository provides two reproducible Python pipelines to generate **81 standalone SVG glyphs** and compile an installable, standards-compliant **TrueType/OpenType font (`.ttf` / `.otf`)**:

1. **Pure Geometric Synthesis (Recommended):** Defines all 81 glyphs directly on an exact $60^\circ / 120^\circ$ equilateral coordinate lattice, expanding strokes into clean mitered polygons via computational geometry (`shapely` + `fonttools`).
2. **Computer Vision Extraction:** Slices, thresholds, and traces the original glowing ARC raster chart into sharp polygonal SVGs and compiles them via `OpenCV`, `Potrace`, and `FontForge`.

---

## 📐 Typographic Findings: How Triglavian Characters Are Constructed

A structural analysis of the 81 graphemes in the ARC reference chart reveals that the Triglavian script is **not** a freehand calligraphy system, nor is it built on a standard orthogonal (Cartesian) grid. Instead, every character is a modular geometric assembly constrained to an **isometric / equilateral triangular lattice** where all stroke angles are multiples of $60^\circ$ ($0^\circ$, $60^\circ$, $120^\circ$).

### 1. The Equilateral Lattice ($\tan 60^\circ = \sqrt{3}$)

Every glyph occupies a $1000 \times 1000$ UPM (Units Per Em) bounding box anchored by two primary equilateral frames:
$$\Delta h = \frac{\sqrt{3}}{2} \cdot s \approx 0.866 \cdot s$$
where $s$ is the side length of the outer bounding triangle ($s = 560\text{ UPM}$, $\Delta h \approx 485\text{ UPM}$).

### 2. Core Structural Primitives

All 81 characters are constructed by combining five recurring geometric primitives:

| Primitive                              | Description                                                                                                                                                                                                | Example Characters                                                                    |
| :------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| **1. Primary Apex Frame ($\Delta$)**   | An upward-pointing equilateral triangle with its apex at top-center $(500, 180)$ and base along $y = 665$. Often features a re-entrant hook at the bottom-right vertex.                                    | `A`, `J`, `K`, `L`, `O`, `S`, `V`, `a`, `f`, `p`, `x`, `1`, `2`, `4`                  |
| **2. Inverted Frame ($\nabla$)**       | A downward-pointing equilateral triangle with its horizontal base at the cap-line ($y = 240$) and apex at $(500, 725)$.                                                                                    | `C`, `F`, `I`, `N`, `Q`, `R`, `T`, `Y`, `b`, `g`, `i`, `q`, `t`, `y`, `0`             |
| **3. Bipartite W / M Zigzag**          | Wide, double-apex or double-inverted frames formed by two adjacent equilateral triangles sharing an inner $60^\circ$ edge.                                                                                 | `E`, `M`, `W`, `X`, `c`, `e`, `l`, `n`, `u`, `v`, `w`, `=`                            |
| **4. Vertical Rhombus ($\diamond$)**   | A $60^\circ / 120^\circ$ diamond formed by joining a half-scale $\Delta$ and $\nabla$ along their horizontal bases. Primarily encodes numerals and mathematical operators.                                 | `8`, `9`, `#`, `-`, `+`                                                               |
| **5. Nested Offset & Diacritic Ticks** | Inner parallel triangles offset inward by a fixed gutter ($\approx 85\text{ UPM}$) and short detached $60^\circ$ or $0^\circ$ floating ticks that distinguish phonetically or structurally similar glyphs. | Inner triangles in `A`, `K`, `U`, `9`; detached ticks in `C`, `I`, `c`, `m`, `:`, `;` |

### 3. Case & Category Differentiation

- **Uppercase (`A`–`Z`):** Characterized by higher stroke density, complete outer triangular frames, and nested inner sub-triangles or crossbars.
- **Lowercase (`a`–`z`):** Simplified reductions of the uppercase frames—frequently omitting one edge of the bounding triangle or replacing an enclosed inner triangle with a single parallel tick.
- **Numerals (`1`–`9`, `0`):** Strictly axisymmetric (or point-symmetric in the case of `6` and `7`) along the vertical centerline ($x = 500$). `1` is a pure $\Delta$, `0` is a $\nabla$ topped with a horizontal bar, and `8`/`9` transition into concentric rhombi.
- **Punctuation & Operators:** Reduced micro-primitives occupying half-scale triangles (`.` `,` `'` `"` `^`) or augmented rhombi (`#` `-` `+`).

---

## 🛠️ Methodology & Build Pipelines

### Method 1: Pure Geometric Lattice Synthesis (`eve_triglavian`)

Standard SVG files support single-line open paths with a visual `stroke-width`, but TrueType (`.ttf`) and OpenType (`.otf`) specifications require **closed, non-overlapping filled contours** with strict winding directions (clockwise for outer contours, counter-clockwise for inner holes in TrueType).

To achieve mathematically crisp glyphs without raster tracing artifacts, `eve_triglavian` executes a 4-stage pipeline:

1. **Lattice Coordinate Resolution:** Maps each character to a declarative list of open and closed polylines snapped to the $60^\circ$ grid.
2. **SVG Export:** Emits 81 lightweight, resolution-independent `.svg` files (`stroke-linejoin="miter"`, `stroke-linecap="butt"`) into `./triglavian_svgs/`.
3. **Mitered Polygon Buffering (Shapely):** Converts each 1D polyline into a 2D polygon by buffering at half the stroke width ($w/2 = 22\text{ UPM}$) using `cap_style=2` (flat) and `join_style=2` (sharp miter). Overlapping strokes within a glyph are merged into a single clean geometry via Boolean union (`shapely.ops.unary_union`), eliminating self-intersecting contours.
4. **Binary Font Compilation (FontTools):** Transforms the merged polygon coordinates from SVG space ($Y$-down) to TrueType space ($Y$-up: $y_{\text{font}} = 850 - y_{\text{svg}}$), writes the outer and inner rings to a `TTGlyphPen`, sets horizontal advance metrics, and compiles `TriglavianGeometric.ttf`.

### Method 2: Computer Vision & Bitmap Tracing (`slice_glyphs.py` + `build_font.py`)

For direct archival extraction from the original ARC character sheet (`EE479357-654A-4AF8-8CF5-93BDA04D06A9.png`), an alternative image-processing pipeline is included:

1. **Luminance Thresholding:** The original artwork features a soft blue bloom around white strokes. Applying a high binary threshold (`> 215` out of `255` in OpenCV) strips the outer glow and isolates the sharp core geometry.
2. **Grid Slicing & Reticle Trimming:** Crops all 81 bounding boxes across the 7 rows and trims the outer $12\%$ margin of each cell to remove the HUD corner reticle ticks.
3. **Polygonal Vectorization:** Passes each cropped bitmap to `potrace` with `--alphamax 0.0`, forcing sharp polygonal corners rather than smoothed Bézier curves.
4. **FontForge Assembly:** Imports the traced SVGs into Unicode slots and generates `TriglavianARC.ttf` and `TriglavianARC.otf`.

---

## 🚀 Quick Start & Tooling (`uv`)

This project uses modern Python packaging with **`uv`**, **`hatchling`**, **`ruff`**, and **`pytest`**.

### Installation & Virtual Environment

Install dependencies and set up the environment with `uv`:

```bash
# Clone and enter directory
cd eve-triglavian

# Install all dependencies and development tools
uv sync --all-groups
```

### CLI Usage

The package provides the `eve-triglavian` CLI command (also runnable directly via `uv run`):

```bash
# 1. Full Build (Exports 81 SVGs and compiles TrueType font into dist/)
uv run eve-triglavian build

# Custom options:
uv run eve-triglavian build --output-dir custom_svgs --ttf-path custom.ttf --stroke-width 50.0

# 2. Export SVGs only (defaults to dist/svg/)
uv run eve-triglavian export-svg

# 3. Compile TTF Font only (defaults to dist/TriglavianGeometric.ttf)
uv run eve-triglavian compile-ttf

# 4. Character Set Overview
uv run eve-triglavian info

# 5. Inspect a Specific Character
uv run eve-triglavian inspect A
```

You can also run the package directly as a module:

```bash
uv run python -m eve_triglavian
```

---

## 📁 Project Structure

```text
eve-triglavian/
├── pyproject.toml              # Build backend (Hatchling), dependencies, and tool configs
├── README.md                   # Typographic documentation and usage instructions
├── reference_sheet.png         # Triglavian grapheme reference sheet (Arataka Research Consortium)
├── dist/                       # Compiled assets distribution
│   ├── TriglavianGeometric.ttf # Standards-compliant TrueType font
│   └── svg/                    # 81 standalone geometric SVG glyphs
├── src/
│   └── eve_triglavian/         # Main Python package
│       ├── __init__.py         # Public exports and version
│       ├── __main__.py         # Module execution entry point (python -m eve_triglavian)
│       ├── constants.py        # Equilateral lattice coordinates (P), UPM, safe names
│       ├── models.py           # Pydantic data models for glyphs and build config
│       ├── glyphs.py           # Declarative polyline definitions for all 81 graphemes
│       ├── geometry.py         # Shapely stroke buffering, boolean union, coordinates
│       ├── svg.py              # SVG generator and bulk exporter
│       ├── font.py             # TrueType font compiler using fontTools
│       └── cli.py              # Typer CLI application (build, export-svg, compile-ttf, info, inspect)
└── tests/                      # Automated test suite (pytest)
    ├── test_constants.py       # Lattice coordinates and point resolution tests
    ├── test_glyphs.py          # Character set completeness (81 glyphs) and category tests
    ├── test_geometry.py       # Stroke buffering and polygon union tests
    ├── test_svg.py             # SVG XML generation and file output tests
    ├── test_font.py            # TTF font table and cmap verification tests
    └── test_cli.py             # Typer CLI commands testing via CliRunner
```

---

## 🧪 Development & Quality Assurance

Run the automated test suite:

```bash
uv run pytest
```

Run linting and formatting checks:

```bash
uv run ruff check .
uv run ruff format --check .
```

---

## 🙏 Credits & Acknowledgments

- **Arataka Research Consortium (ARC):** Sincere credit and gratitude to the Arataka Research Consortium for their groundbreaking decoding work, compilation, and publication of the Triglavian grapheme reference sheet (`reference_sheet.png`, cataloged as `triglavian_grapheme_samples // crossreference TD-1`). This research provided the foundational specimen data and visual reference required to reconstruct these geometric vectors.

---

## ⚖️ Legal Disclaimer

All _EVE Online_ materials, Triglavian emblems, graphemes, lore, and related intellectual property are the property of **Fenris Corporation**.

This repository is an unofficial, non-commercial community research and typography reconstruction project created for educational, analytical, and artistic purposes under fair-use principles. No endorsement by or affiliation with Fenris Corporation is implied.

---

## 📄 License

This software and font generation toolkit is distributed under the [MIT License](LICENSE).
