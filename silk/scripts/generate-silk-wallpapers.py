#!/usr/bin/env python3
"""Generate 10 Silk desktop wallpapers + 10 lock screens (Mac/Win fusion, no logos)."""
from __future__ import annotations

import json
import math
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1920, 1080
OUT = Path(__file__).resolve().parent.parent / "system_files/usr/share/silk/wallpapers"

THEMES = [
    {"id": "01", "name": "Aurora Mac", "desc": "Sanfte Aurora-Wellen, Mac-inspiriert",
     "c1": (15, 23, 42), "c2": (67, 56, 202), "c3": (14, 165, 233), "bloom": (129, 140, 248)},
    {"id": "02", "name": "Fluent Win11", "desc": "Zentrales Bloom-Licht, Windows 11",
     "c1": (2, 6, 23), "c2": (30, 58, 138), "c3": (59, 130, 246), "bloom": (96, 165, 250)},
    {"id": "03", "name": "Mac Dark", "desc": "Dunkler Mac-Nachtmodus",
     "c1": (10, 10, 15), "c2": (30, 27, 75), "c3": (55, 48, 107), "bloom": (139, 92, 246)},
    {"id": "04", "name": "Win10 Classic", "desc": "Klassisches Windows-Blau",
     "c1": (0, 48, 87), "c2": (0, 120, 215), "c3": (0, 174, 239), "bloom": (125, 211, 252)},
    {"id": "05", "name": "Silk Teal", "desc": "Seiden-Teal mit Silber",
     "c1": (4, 47, 46), "c2": (13, 148, 136), "c3": (45, 212, 191), "bloom": (153, 246, 228)},
    {"id": "06", "name": "Sunset Mac", "desc": "Mac-Sonnenuntergang",
     "c1": (30, 15, 35), "c2": (190, 75, 120), "c3": (251, 146, 60), "bloom": (253, 186, 116)},
    {"id": "07", "name": "Fluent Dark", "desc": "Dunkles Fluent Design",
     "c1": (15, 15, 20), "c2": (37, 99, 235), "c3": (29, 78, 216), "bloom": (147, 197, 253)},
    {"id": "08", "name": "Silk Midnight", "desc": "Mitternacht mit Goldakzent",
     "c1": (8, 12, 28), "c2": (30, 41, 59), "c3": (51, 65, 85), "bloom": (251, 191, 36)},
    {"id": "09", "name": "Big Sur Green", "desc": "Mac Big-Sur-Grün-Blau",
     "c1": (6, 40, 35), "c2": (16, 185, 129), "c3": (56, 189, 248), "bloom": (110, 231, 183)},
    {"id": "10", "name": "Win Purple", "desc": "Windows-Lila-Nacht",
     "c1": (25, 16, 45), "c2": (88, 28, 135), "c3": (168, 85, 247), "bloom": (216, 180, 254)},
]


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def blend(c1, c2, t: float):
    return tuple(lerp(c1[i], c2[i], t) for i in range(3))


def base_gradient(c1, c2, c3) -> Image.Image:
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        t = y / max(H - 1, 1)
        if t < 0.55:
            row = blend(c1, c2, t / 0.55)
        else:
            row = blend(c2, c3, (t - 0.55) / 0.45)
        for x in range(W):
            px[x, y] = row
    return img


def add_bloom(img: Image.Image, bloom, cx=0.5, cy=0.45, rx=0.55, ry=0.35, alpha=0.45) -> Image.Image:
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    bx, by = int(W * cx), int(H * cy)
    brx, bry = int(W * rx), int(H * ry)
    for i in range(8, 0, -1):
        a = int(255 * alpha * (i / 8) ** 1.5)
        draw.ellipse(
            (bx - brx * i / 8, by - bry * i / 8, bx + brx * i / 8, by + bry * i / 8),
            fill=(*bloom, a),
        )
    return Image.alpha_composite(img.convert("RGBA"), layer)


def add_silk_ribbons(img: Image.Image, accent) -> Image.Image:
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for n in range(3):
        pts = []
        y0 = H * (0.25 + n * 0.22)
        for x in range(0, W + 1, 40):
            y = y0 + math.sin(x / 180 + n) * 60 + math.cos(x / 320) * 30
            pts.append((x, y))
        width = 18 - n * 4
        draw.line(pts, fill=(*accent, 35 + n * 10), width=width, joint="curve")
    blurred = layer.filter(ImageFilter.GaussianBlur(radius=12))
    return Image.alpha_composite(img.convert("RGBA"), blurred)


def add_vignette(img: Image.Image, strength=0.35) -> Image.Image:
    layer = Image.new("L", (W, H), 0)
    draw = ImageDraw.Draw(layer)
    draw.ellipse((-W * 0.15, -H * 0.2, W * 1.15, H * 1.2), fill=int(255 * (1 - strength)))
    layer = layer.filter(ImageFilter.GaussianBlur(radius=80))
    dark = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    return Image.composite(img.convert("RGBA"), dark, layer)


def make_desktop(theme: dict) -> Image.Image:
    img = base_gradient(theme["c1"], theme["c2"], theme["c3"])
    img = add_bloom(img, theme["bloom"], alpha=0.38)
    img = add_silk_ribbons(img, theme["bloom"])
    return img.convert("RGB")


def make_lock(theme: dict) -> Image.Image:
    # darker base
    c1 = tuple(max(0, c - 25) for c in theme["c1"])
    c2 = tuple(max(0, c - 15) for c in theme["c2"])
    c3 = tuple(max(0, c - 10) for c in theme["c3"])
    img = base_gradient(c1, c2, c3)
    img = add_bloom(img, theme["bloom"], cy=0.42, alpha=0.22)
    img = add_silk_ribbons(img, theme["bloom"])
    img = add_vignette(img, 0.45)

    draw = ImageDraw.Draw(img)
    text = "Silk"
    font = None
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
    ):
        if os.path.exists(path):
            font = ImageFont.truetype(path, 72)
            break
    if font is None:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x, y = (W - tw) // 2, H - th - 80
    draw.text((x + 2, y + 2), text, fill=(0, 0, 0, 120), font=font)
    draw.text((x, y), text, fill=(255, 255, 255, 200), font=font)
    sub = f"{theme['name']} · Lock"
    draw.text((W // 2 - 80, y + th + 8), sub, fill=(200, 210, 230, 160), font=ImageFont.load_default())
    return img.convert("RGB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {"desktop": [], "lock": []}

    for t in THEMES:
        did = t["id"]
        desk_path = OUT / f"silk-desktop-{did}.png"
        lock_path = OUT / f"silk-lock-{did}.png"
        print(f"Generating {did}: {t['name']}")
        make_desktop(t).save(desk_path, "PNG", optimize=True)
        make_lock(t).save(lock_path, "PNG", optimize=True)
        manifest["desktop"].append({
            "id": did, "file": desk_path.name, "name": t["name"], "desc": t["desc"],
        })
        manifest["lock"].append({
            "id": did, "file": lock_path.name, "name": t["name"], "desc": t["desc"],
        })

    # Default symlinks / copies for legacy paths
    (OUT / "silk-desktop.png").write_bytes((OUT / "silk-desktop-01.png").read_bytes())
    (OUT / "silk-lock.png").write_bytes((OUT / "silk-lock-01.png").read_bytes())

    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Done: {len(THEMES)} desktop + {len(THEMES)} lock → {OUT}")


if __name__ == "__main__":
    main()
