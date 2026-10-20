"""Tests for TrueType font assembly and TTGlyphPen rendering."""

from pathlib import Path
from fontTools.ttLib import TTFont
from eve_triglavian.font import compile_ttf_font
from eve_triglavian.glyphs import GLYPHS


def test_compile_ttf_font(tmp_path: Path):
    font_file = tmp_path / "TestTriglavian.ttf"
    result = compile_ttf_font(output_path=font_file)

    assert result.exists()
    assert result.stat().st_size > 0

    # Inspect compiled font tables using fontTools TTFont
    tt = TTFont(str(result))
    assert "glyf" in tt
    assert "cmap" in tt
    assert "head" in tt
    assert "hhea" in tt
    assert "name" in tt
    assert "OS/2" in tt

    # Check cmap entries for space and characters
    cmap = tt.getBestCmap()
    assert 32 in cmap  # space
    assert ord("A") in cmap
    assert ord("z") in cmap
    assert ord("0") in cmap
    assert ord("?") in cmap
    assert len(cmap) >= len(GLYPHS) + 1  # 81 characters + space
