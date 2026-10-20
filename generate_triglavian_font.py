#!/usr/bin/env python3
"""Triglavian font generation pipeline entry point.

Backward-compatible entry point and CLI wrapper for the eve_triglavian package.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Add src to sys.path so running directly works without prior pip/uv editable install
sys.path.insert(0, str(Path(__file__).parent / "src"))

from eve_triglavian.cli import app
from eve_triglavian.constants import DEFAULT_STROKE_WIDTH as STROKE_WIDTH, P, SAFE_NAMES, UPM, pt
from eve_triglavian.font import compile_ttf_font
from eve_triglavian.geometry import build_glyph_polygon, stroke_to_polygon
from eve_triglavian.glyphs import GLYPHS
from eve_triglavian.svg import export_all_svgs, generate_glyph_svg_content

if __name__ == "__main__":
    if len(sys.argv) == 1:
        # Default behavior matching original script when run without args:
        # Export SVGs and compile TTF font
        app(["build"])
    else:
        app()
