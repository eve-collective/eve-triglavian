"""SVG generation and batch export utilities for Triglavian glyphs."""

from __future__ import annotations

from pathlib import Path

from eve_triglavian.constants import DEFAULT_STROKE_WIDTH, UPM
from eve_triglavian.glyphs import GLYPHS, get_glyph_safe_name


def generate_glyph_svg_content(
    char: str,
    stroke_width: float = DEFAULT_STROKE_WIDTH,
    stroke_color: str = "#FFFFFF",
    upm: int = UPM,
) -> str:
    """Generate standalone SVG markup for a single Triglavian character.

    Args:
        char: The character to render.
        stroke_width: Kept for API backwards-compatibility.
        stroke_color: Fill and stroke color hex string.
        upm: Canvas width and height in units per em.

    Returns:
        A formatted SVG XML string with sharp filled polygonal paths.
    """
    if char not in GLYPHS:
        raise KeyError(f"Character '{char}' is not in Triglavian GLYPHS dictionary.")

    polys = GLYPHS[char]
    d_parts = []
    for p_dict in polys:
        shell = p_dict["shell"]
        if len(shell) >= 3:
            d_parts.append("M " + " L ".join(f"{x:.1f},{y:.1f}" for x, y in shell) + " Z")
        for hole in p_dict.get("holes", []):
            if len(hole) >= 3:
                d_parts.append("M " + " L ".join(f"{x:.1f},{y:.1f}" for x, y in hole) + " Z")

    combined_d = " ".join(d_parts)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {upm} {upm}" width="100%" height="100%">\n'
        f"  <!-- Triglavian Glyph: {char} (U+{ord(char):04X}) -->\n"
        f'  <path d="{combined_d}" fill="{stroke_color}" fill-rule="evenodd" />\n'
        f"</svg>"
    )


def export_all_svgs(
    output_dir: str | Path = "dist/svg",
    stroke_width: float = DEFAULT_STROKE_WIDTH,
    stroke_color: str = "#FFFFFF",
) -> list[Path]:
    """Export all 81 glyphs as standalone SVG files to the specified directory.

    Args:
        output_dir: Destination directory path.
        stroke_width: Kept for API backwards-compatibility.
        stroke_color: Fill color hex string.

    Returns:
        List of Paths of the written SVG files.
    """
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    exported_files: list[Path] = []
    for char in GLYPHS:
        fname = f"{get_glyph_safe_name(char)}.svg"
        file_path = out_path / fname
        content = generate_glyph_svg_content(
            char=char,
            stroke_width=stroke_width,
            stroke_color=stroke_color,
        )
        file_path.write_text(content, encoding="utf-8")
        exported_files.append(file_path)

    return exported_files
