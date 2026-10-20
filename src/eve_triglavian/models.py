"""Data models, configuration, and validation structures using Pydantic."""

from __future__ import annotations

from enum import Enum
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from eve_triglavian.constants import DEFAULT_STROKE_WIDTH, UPM


class GlyphCategory(str, Enum):
    """Categorical classification of a Triglavian grapheme."""

    UPPERCASE = "uppercase"
    LOWERCASE = "lowercase"
    NUMERAL = "numeral"
    SYMBOL = "symbol"


class Point2D(BaseModel):
    """A 2D coordinate on the equilateral lattice."""

    x: float
    y: float

    model_config = ConfigDict(frozen=True)


class GlyphStroke(BaseModel):
    """A single polyline path comprising two or more points."""

    points: list[Point2D]

    model_config = ConfigDict(frozen=True)

    @property
    def is_closed(self) -> bool:
        """Return True if polyline starts and ends at the identical coordinate."""
        if len(self.points) < 2:
            return False
        return self.points[0] == self.points[-1]


class GlyphInfo(BaseModel):
    """Metadata describing a single Triglavian character."""

    character: str
    category: GlyphCategory
    unicode_codepoint: int
    unicode_hex: str
    safe_name: str
    stroke_count: int

    model_config = ConfigDict(frozen=True)


class FontMetadata(BaseModel):
    """Naming and horizontal header metrics for TrueType font assembly."""

    family_name: str = "Triglavian Geometric"
    style_name: str = "Regular"
    unique_font_identifier: str = "TriglavianGeometric-Regular"
    full_name: str = "Triglavian Geometric Regular"
    ps_name: str = "TriglavianGeometric-Regular"
    version: str = "Version 1.0"
    ascent: int = 850
    descent: int = -150
    upm: int = UPM

    model_config = ConfigDict(frozen=True)


class BuildConfig(BaseModel):
    """Configuration options for font and SVG generation."""

    stroke_width: float = Field(default=DEFAULT_STROKE_WIDTH, gt=0)
    svg_dir: Path = Field(default=Path("triglavian_svgs"))
    ttf_path: Path = Field(default=Path("TriglavianGeometric.ttf"))
    export_svg: bool = True
    compile_ttf: bool = True
    font_metadata: FontMetadata = Field(default_factory=FontMetadata)

    model_config = ConfigDict(arbitrary_types_allowed=True)


class BuildSummary(BaseModel):
    """Execution summary produced after building glyph assets."""

    glyph_count: int
    svg_count: int
    ttf_generated: bool
    svg_dir: Optional[str] = None
    ttf_path: Optional[str] = None
    duration_seconds: float = 0.0

    model_config = ConfigDict(frozen=True)
