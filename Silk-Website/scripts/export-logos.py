#!/usr/bin/env python3
"""PNG-Exporte aus den Silk-SVG-Logos erzeugen."""
from pathlib import Path

import cairosvg

ROOT = Path(__file__).resolve().parent.parent / "assets"
EXPORTS = [
    ("logo.svg", "logo.png", 880),
    ("logo-light.svg", "logo-light.png", 880),
    ("logo-icon.svg", "logo-icon-512.png", 512),
    ("logo-icon.svg", "logo-icon-256.png", 256),
    ("logo-icon.svg", "logo-icon-128.png", 128),
]


def export_png(svg_name: str, png_name: str, width: int) -> None:
    svg = ROOT / svg_name
    png = ROOT / png_name
    cairosvg.svg2png(url=str(svg), write_to=str(png), output_width=width)
    print(f"OK  {png_name} ({width}px)")


def main() -> None:
    for svg_name, png_name, width in EXPORTS:
        export_png(svg_name, png_name, width)


if __name__ == "__main__":
    main()
