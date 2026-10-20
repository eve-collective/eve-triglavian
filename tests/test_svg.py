"""Tests for SVG output generation."""

from pathlib import Path

from eve_triglavian.glyphs import GLYPHS
from eve_triglavian.svg import export_all_svgs, generate_glyph_svg_content


def test_generate_glyph_svg_content():
    svg_a = generate_glyph_svg_content("A")
    assert "<svg" in svg_a
    assert "</svg>" in svg_a
    assert 'viewBox="0 0 1000 1000"' in svg_a
    assert "<path" in svg_a
    assert "U+0041" in svg_a


def test_export_all_svgs(tmp_path: Path):
    out_dir = tmp_path / "svgs"
    files = export_all_svgs(output_dir=out_dir)
    assert len(files) == len(GLYPHS)
    assert len(files) == 81
    for f in files:
        assert f.exists()
        assert f.stat().st_size > 0
