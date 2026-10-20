"""Command-line interface for the Triglavian typography toolkit."""

from __future__ import annotations

import time
from pathlib import Path

import typer

from eve_triglavian.constants import DEFAULT_STROKE_WIDTH
from eve_triglavian.font import compile_ttf_font
from eve_triglavian.geometry import build_glyph_polygon
from eve_triglavian.glyphs import GLYPHS, get_glyph_info, get_glyph_strokes, list_all_glyph_info
from eve_triglavian.models import BuildConfig, BuildSummary
from eve_triglavian.svg import export_all_svgs

app = typer.Typer(
    name="eve-triglavian",
    help="Triglavian Collective Typography & Geometric Font Toolkit for EVE Online.",
    add_completion=False,
)


@app.command()
def build(
    svg: bool = typer.Option(True, "--svg/--no-svg", help="Export standalone SVG files."),
    ttf: bool = typer.Option(True, "--ttf/--no-ttf", help="Compile TrueType font (.ttf)."),
    output_dir: Path = typer.Option(
        Path("triglavian_svgs"),
        "--output-dir",
        "-o",
        help="Directory to save exported SVG files.",
    ),
    ttf_path: Path = typer.Option(
        Path("TriglavianGeometric.ttf"),
        "--ttf-path",
        "-t",
        help="Destination path for compiled .ttf font.",
    ),
    stroke_width: float = typer.Option(
        DEFAULT_STROKE_WIDTH,
        "--stroke-width",
        "-w",
        help="Stroke width in canvas units (UPM).",
    ),
) -> None:
    """Run the complete pipeline: export SVGs and/or compile TrueType font."""
    start_time = time.perf_counter()
    config = BuildConfig(
        stroke_width=stroke_width,
        svg_dir=output_dir,
        ttf_path=ttf_path,
        export_svg=svg,
        compile_ttf=ttf,
    )

    typer.secho(
        f"⚡ Triglavian Generator starting for {len(GLYPHS)} graphemes...",
        fg=typer.colors.CYAN,
        bold=True,
    )

    exported_svgs = []
    if config.export_svg:
        typer.echo(f"  [1/2] Exporting SVGs to {config.svg_dir}/ ...")
        exported_svgs = export_all_svgs(
            output_dir=config.svg_dir,
            stroke_width=config.stroke_width,
        )
        typer.secho(
            f"  ✓ Exported {len(exported_svgs)} vector SVGs",
            fg=typer.colors.GREEN,
        )

    ttf_created = False
    if config.compile_ttf:
        typer.echo(f"  [2/2] Compiling TrueType font to {config.ttf_path} ...")
        compile_ttf_font(
            output_path=config.ttf_path,
            stroke_width=config.stroke_width,
            metadata=config.font_metadata,
        )
        ttf_created = True
        typer.secho(
            f"  ✓ Compiled TrueType font: {config.ttf_path}",
            fg=typer.colors.GREEN,
        )

    duration = time.perf_counter() - start_time
    summary = BuildSummary(
        glyph_count=len(GLYPHS),
        svg_count=len(exported_svgs),
        ttf_generated=ttf_created,
        svg_dir=str(config.svg_dir) if config.export_svg else None,
        ttf_path=str(config.ttf_path) if config.compile_ttf else None,
        duration_seconds=round(duration, 3),
    )

    typer.secho(
        f"\n✨ Done in {summary.duration_seconds}s! Processed {summary.glyph_count} glyphs.",
        fg=typer.colors.MAGENTA,
        bold=True,
    )


@app.command("export-svg")
def export_svg_cmd(
    output_dir: Path = typer.Option(
        Path("triglavian_svgs"),
        "--output-dir",
        "-o",
        help="Directory to save exported SVG files.",
    ),
    stroke_width: float = typer.Option(
        DEFAULT_STROKE_WIDTH,
        "--stroke-width",
        "-w",
        help="Stroke width in canvas units (UPM).",
    ),
) -> None:
    """Export standalone SVG files for all 81 glyphs."""
    typer.echo(f"Exporting {len(GLYPHS)} SVGs to {output_dir}/...")
    files = export_all_svgs(output_dir=output_dir, stroke_width=stroke_width)
    typer.secho(f"✓ Exported {len(files)} SVGs to {output_dir}/", fg=typer.colors.GREEN)


@app.command("compile-ttf")
def compile_ttf_cmd(
    output: Path = typer.Option(
        Path("TriglavianGeometric.ttf"),
        "--output",
        "-o",
        help="Path to compiled .ttf font.",
    ),
    stroke_width: float = typer.Option(
        DEFAULT_STROKE_WIDTH,
        "--stroke-width",
        "-w",
        help="Stroke width in canvas units (UPM).",
    ),
) -> None:
    """Compile installable TrueType (.ttf) font file."""
    typer.echo(f"Compiling TrueType font to {output}...")
    compile_ttf_font(output_path=output, stroke_width=stroke_width)
    typer.secho(f"✓ Saved TrueType font to {output}", fg=typer.colors.GREEN)


@app.command()
def info() -> None:
    """Display information and summary of all supported characters."""
    all_glyphs = list_all_glyph_info()
    categories: dict[str, list[str]] = {}
    for g in all_glyphs:
        categories.setdefault(g.category.value, []).append(g.character)

    typer.secho("Triglavian Collective Character Set Overview", fg=typer.colors.CYAN, bold=True)
    typer.echo(f"Total Glyphs: {len(all_glyphs)}")
    for cat_name, chars in categories.items():
        typer.echo(f"  • {cat_name.title()} ({len(chars)}): {' '.join(chars)}")


@app.command()
def inspect(char: str = typer.Argument(..., help="Single character to inspect")) -> None:
    """Inspect the geometric strokes and metadata of a specific character."""
    if char not in GLYPHS:
        typer.secho(f"Character '{char}' not found in Triglavian glyph set.", fg=typer.colors.RED)
        raise typer.Exit(code=1)

    info_data = get_glyph_info(char)
    strokes = get_glyph_strokes(char)
    poly = build_glyph_polygon(char)

    typer.secho(
        f"Glyph: {info_data.character} ({info_data.unicode_hex})", fg=typer.colors.CYAN, bold=True
    )
    typer.echo(f"  Category:    {info_data.category.value}")
    typer.echo(f"  Safe Name:   {info_data.safe_name}")
    typer.echo(f"  Strokes:     {info_data.stroke_count}")
    typer.echo(f"  Bounds:      {poly.bounds}")
    for idx, stroke in enumerate(strokes, start=1):
        pt_strs = [f"({p.x:.0f}, {p.y:.0f})" for p in stroke.points]
        typer.echo(
            f"    Stroke {idx} ({len(stroke.points)} pts, closed={stroke.is_closed}): {' -> '.join(pt_strs)}"
        )


if __name__ == "__main__":
    app()
