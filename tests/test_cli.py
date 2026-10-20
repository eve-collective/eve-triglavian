"""Tests for Typer CLI commands."""

from pathlib import Path

from typer.testing import CliRunner

from eve_triglavian.cli import app

runner = CliRunner()


def test_cli_help():
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    assert "Triglavian Collective Typography" in result.output
    assert "build" in result.output
    assert "export-svg" in result.output
    assert "compile-ttf" in result.output
    assert "info" in result.output
    assert "inspect" in result.output


def test_cli_info():
    result = runner.invoke(app, ["info"])
    assert result.exit_code == 0
    assert "Total Glyphs: 81" in result.output
    assert "Uppercase (26)" in result.output
    assert "Lowercase (26)" in result.output
    assert "Numeral (10)" in result.output
    assert "Symbol (19)" in result.output


def test_cli_inspect():
    result = runner.invoke(app, ["inspect", "A"])
    assert result.exit_code == 0
    assert "Glyph: A (U+0041)" in result.output
    assert "Category:    uppercase" in result.output
    assert "Safe Name:   upper_A" in result.output


def test_cli_inspect_invalid():
    result = runner.invoke(app, ["inspect", "~"])
    assert result.exit_code != 0


def test_cli_build(tmp_path: Path):
    svg_dir = tmp_path / "svgs"
    ttf_path = tmp_path / "TriglavianTest.ttf"
    result = runner.invoke(
        app,
        [
            "build",
            "--output-dir",
            str(svg_dir),
            "--ttf-path",
            str(ttf_path),
        ],
    )
    assert result.exit_code == 0
    assert ttf_path.exists()
    assert svg_dir.exists()
    assert len(list(svg_dir.glob("*.svg"))) == 81
