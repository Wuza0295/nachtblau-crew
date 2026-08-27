#!/usr/bin/env python3
"""Generate Silk wallpapers: 20 Mac-like + 20 Windows-like desktop & lock screens."""
from __future__ import annotations

import json
import math
import os
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

W, H = 2560, 1440  # render high, save optimized
OUT = Path(__file__).resolve().parent.parent / "system_files/usr/share/silk/wallpapers"

# family: mac | win | fusion
THEMES = [
    # --- macOS-inspiriert (01–10) ---
    {"id": "01", "family": "mac", "name": "Big Sur Blue", "desc": "Mesh-Gradient wie macOS Big Sur",
     "style": "mac_mesh", "base": (8, 15, 35), "blobs": [(0.15, 0.35, (0, 122, 255), 0.55), (0.75, 0.25, (175, 82, 222), 0.45), (0.55, 0.75, (0, 199, 190), 0.4)]},
    {"id": "02", "family": "mac", "name": "Monterey Purple", "desc": "Lila-Rosa Mesh wie Monterey",
     "style": "mac_mesh", "base": (18, 10, 35), "blobs": [(0.2, 0.4, (147, 51, 234), 0.5), (0.8, 0.3, (236, 72, 153), 0.42), (0.5, 0.8, (59, 130, 246), 0.35)]},
    {"id": "03", "family": "mac", "name": "Ventura Dawn", "desc": "Sanftes Ventura-Blau",
     "style": "mac_waves", "base": (12, 20, 45), "accent": (56, 189, 248), "accent2": (129, 140, 248)},
    {"id": "04", "family": "mac", "name": "Sonoma Sunset", "desc": "Warmes Sonoma Rot-Lila",
     "style": "mac_mesh", "base": (25, 12, 28), "blobs": [(0.3, 0.45, (225, 29, 72), 0.48), (0.7, 0.35, (249, 115, 22), 0.4), (0.5, 0.7, (168, 85, 247), 0.38)]},
    {"id": "05", "family": "mac", "name": "Mac Dark Graphite", "desc": "Dunkler Mac-Nachtmodus",
     "style": "mac_dark", "base": (12, 12, 14), "blobs": [(0.5, 0.45, (60, 60, 67), 0.35), (0.2, 0.7, (39, 39, 42), 0.3)]},
    {"id": "06", "family": "mac", "name": "Catalina Teal", "desc": "Türkis-Grün Catalina",
     "style": "mac_waves", "base": (6, 35, 40), "accent": (20, 184, 166), "accent2": (6, 182, 212)},
    {"id": "07", "family": "mac", "name": "Mojave Dunes", "desc": "Warmes Mojave Orange",
     "style": "mac_mesh", "base": (35, 20, 15), "blobs": [(0.4, 0.5, (234, 88, 12), 0.45), (0.65, 0.3, (251, 191, 36), 0.35), (0.25, 0.7, (180, 83, 9), 0.3)]},
    {"id": "08", "family": "mac", "name": "Sequoia Forest", "desc": "Grün-blau wie Sequoia",
     "style": "mac_waves", "base": (8, 28, 22), "accent": (34, 197, 94), "accent2": (14, 165, 233)},
    {"id": "09", "family": "mac", "name": "Mac Pink Sky", "desc": "Rosa Himmel Mesh",
     "style": "mac_mesh", "base": (30, 15, 35), "blobs": [(0.35, 0.4, (244, 114, 182), 0.5), (0.7, 0.55, (167, 139, 250), 0.42), (0.2, 0.75, (251, 113, 133), 0.35)]},
    {"id": "10", "family": "mac", "name": "Mac Aurora Night", "desc": "Nacht-Aurora Big Sur",
     "style": "mac_mesh", "base": (5, 8, 22), "blobs": [(0.25, 0.35, (79, 70, 229), 0.55), (0.75, 0.4, (14, 165, 233), 0.45), (0.5, 0.65, (99, 102, 241), 0.4)]},
    # --- Windows-inspiriert (11–20) ---
    {"id": "11", "family": "win", "name": "Win11 Bloom Blue", "desc": "Windows 11 Standard-Bloom",
     "style": "win11_bloom", "base": (15, 18, 30), "bloom": (0, 120, 215), "bloom2": (96, 165, 250)},
    {"id": "12", "family": "win", "name": "Win11 Dark", "desc": "Windows 11 Dunkelmodus",
     "style": "win11_bloom", "base": (8, 8, 12), "bloom": (37, 99, 235), "bloom2": (59, 130, 246)},
    {"id": "13", "family": "win", "name": "Win11 Flow", "desc": "Fließende Win11-Bänder",
     "style": "win11_ribbons", "base": (10, 14, 28), "ribbon": (0, 174, 239), "ribbon2": (125, 211, 252)},
    {"id": "14", "family": "win", "name": "Win10 Hero", "desc": "Klassisches Windows 10 Blau",
     "style": "win10_hero", "base": (0, 78, 140), "light": (0, 174, 239), "sky": (0, 120, 215)},
    {"id": "15", "family": "win", "name": "Win10 Enterprise", "desc": "Dunkles Win10 Enterprise",
     "style": "win10_hero", "base": (0, 35, 60), "light": (0, 120, 215), "sky": (0, 90, 158)},
    {"id": "16", "family": "win", "name": "Win11 Purple Night", "desc": "Win11 Lila-Nacht",
     "style": "win11_bloom", "base": (18, 12, 35), "bloom": (124, 58, 237), "bloom2": (167, 139, 250)},
    {"id": "17", "family": "win", "name": "Win11 Teal Glow", "desc": "Teal Fluent Glow",
     "style": "win11_ribbons", "base": (8, 22, 28), "ribbon": (20, 184, 166), "ribbon2": (94, 234, 212)},
    {"id": "18", "family": "win", "name": "Win10 Light Ray", "desc": "Helles Win10 mit Lichtstrahl",
     "style": "win10_light", "base": (0, 100, 180), "ray": (255, 255, 255)},
    {"id": "19", "family": "win", "name": "Win11 Sunrise", "desc": "Win11 Sonnenaufgang-Bloom",
     "style": "win11_bloom", "base": (25, 18, 35), "bloom": (251, 146, 60), "bloom2": (253, 186, 116)},
    {"id": "20", "family": "win", "name": "Win Slate", "desc": "Neutrales Fluent Slate",
     "style": "win11_ribbons", "base": (22, 26, 32), "ribbon": (100, 116, 139), "ribbon2": (148, 163, 184)},
]


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def blend_rgb(c1, c2, t: float):
    return tuple(int(lerp(c1[i], c2[i], t)) for i in range(3))


def fill_base(color) -> Image.Image:
    return Image.new("RGB", (W, H), color)


def add_radial_blob(img: Image.Image, cx: float, cy: float, color, radius: float, alpha: float) -> Image.Image:
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    bx, by = int(W * cx), int(H * cy)
    r = int(min(W, H) * radius)
    steps = 12
    for i in range(steps, 0, -1):
        a = int(255 * alpha * (i / steps) ** 1.8)
        ri = int(r * i / steps)
        draw.ellipse((bx - ri, by - ri, bx + ri, by + ri), fill=(*color, a))
    blurred = layer.filter(ImageFilter.GaussianBlur(radius=max(8, r // 18)))
    return Image.alpha_composite(img.convert("RGBA"), blurred)


def add_noise(img: Image.Image, amount=6) -> Image.Image:
    noise = Image.effect_noise((W, H), amount).convert("RGB")
    return ImageChops.screen(img, noise)


def render_mac_mesh(theme: dict) -> Image.Image:
    img = fill_base(theme["base"]).convert("RGBA")
    for cx, cy, color, alpha in theme.get("blobs", []):
        img = add_radial_blob(img, cx, cy, color, 0.55, alpha)
    return img.convert("RGB")


def render_mac_waves(theme: dict) -> Image.Image:
    img = fill_base(theme["base"]).convert("RGBA")
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    colors = [theme["accent"], theme["accent2"]]
    for n, col in enumerate(colors):
        pts = []
        y_base = H * (0.35 + n * 0.18)
        for x in range(0, W + 1, 8):
            y = y_base + math.sin(x / 220 + n * 1.2) * 120 + math.cos(x / 380) * 60
            pts.append((x, y))
        draw.line(pts, fill=(*col, 90), width=140, joint="curve")
    layer = layer.filter(ImageFilter.GaussianBlur(radius=45))
    img = Image.alpha_composite(img, layer)
    img = add_radial_blob(img, 0.5, 0.4, theme["accent"], 0.5, 0.25)
    return img.convert("RGB")


def render_mac_dark(theme: dict) -> Image.Image:
    img = fill_base(theme["base"]).convert("RGBA")
    for cx, cy, color, alpha in theme.get("blobs", []):
        img = add_radial_blob(img, cx, cy, color, 0.6, alpha)
    # subtle top light like macOS menu bar area
    img = add_radial_blob(img, 0.5, 0.05, (80, 80, 90), 0.7, 0.12)
    return img.convert("RGB")


def render_win11_bloom(theme: dict) -> Image.Image:
    img = fill_base(theme["base"]).convert("RGBA")
    img = add_radial_blob(img, 0.52, 0.48, theme["bloom"], 0.65, 0.55)
    img = add_radial_blob(img, 0.48, 0.52, theme["bloom2"], 0.45, 0.35)
    img = add_radial_blob(img, 0.3, 0.35, theme["bloom2"], 0.3, 0.15)
    return img.convert("RGB")


def render_win11_ribbons(theme: dict) -> Image.Image:
    img = fill_base(theme["base"]).convert("RGBA")
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for n, col in enumerate([theme["ribbon"], theme["ribbon2"]]):
        pts = []
        for x in range(0, W + 1, 6):
            t = x / W
            y = H * (0.25 + n * 0.15) + math.sin(t * math.pi * 2.5 + n) * H * 0.12 + t * H * 0.35
            pts.append((x, y))
        draw.line(pts, fill=(*col, 110), width=100, joint="curve")
    layer = layer.filter(ImageFilter.GaussianBlur(radius=35))
    img = Image.alpha_composite(img, layer)
    img = add_radial_blob(img, 0.5, 0.45, theme["ribbon"], 0.4, 0.2)
    return img.convert("RGB")


def render_win10_hero(theme: dict) -> Image.Image:
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        for x in range(W):
            t = y / H
            c = blend_rgb(theme["base"], theme["sky"], t ** 0.7)
            px[x, y] = c
    img = img.convert("RGBA")
    img = add_radial_blob(img, 0.85, 0.15, theme["light"], 0.55, 0.5)
    img = add_radial_blob(img, 0.15, 0.85, theme["light"], 0.35, 0.2)
    return img.convert("RGB")


def render_win10_light(theme: dict) -> Image.Image:
    img = fill_base(theme["base"]).convert("RGBA")
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.polygon([(W * 0.1, H), (W * 0.55, 0), (W * 0.75, 0), (W, H)], fill=(*theme["ray"], 35))
    layer = layer.filter(ImageFilter.GaussianBlur(radius=60))
    img = Image.alpha_composite(img, layer)
    img = add_radial_blob(img, 0.6, 0.3, (255, 255, 255), 0.35, 0.15)
    return img.convert("RGB")


def render_desktop(theme: dict) -> Image.Image:
    style = theme["style"]
    renderers = {
        "mac_mesh": render_mac_mesh,
        "mac_waves": render_mac_waves,
        "mac_dark": render_mac_dark,
        "win11_bloom": render_win11_bloom,
        "win11_ribbons": render_win11_ribbons,
        "win10_hero": render_win10_hero,
        "win10_light": render_win10_light,
    }
    img = renderers[style](theme)
    img = add_noise(img, 4)
    return img.resize((1920, 1080), Image.Resampling.LANCZOS)


def add_frosted_lock_bar(img: Image.Image) -> Image.Image:
    """Bottom frosted area like macOS/Win lock screen."""
    bar_h = int(H * 0.22)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.rectangle((0, H - bar_h, W, H), fill=(255, 255, 255, 18))
    blurred_bg = img.convert("RGBA").crop((0, H - bar_h - 40, W, H)).filter(ImageFilter.GaussianBlur(radius=25))
    img = img.convert("RGBA")
    img.paste(blurred_bg, (0, H - bar_h - 20), blurred_bg)
    img = Image.alpha_composite(img, layer)
    return img


def render_lock(theme: dict, desktop: Image.Image) -> Image.Image:
    # Start from upscaled desktop, darken
    lock = desktop.resize((W, H), Image.Resampling.LANCZOS).convert("RGBA")
    dark = Image.new("RGBA", lock.size, (0, 0, 0, 140))
    lock = Image.alpha_composite(lock, dark)
    lock = add_frosted_lock_bar(lock)
    lock = lock.filter(ImageFilter.GaussianBlur(radius=0.5))

    draw = ImageDraw.Draw(lock)
    font_big = font_sub = ImageFont.load_default()
    font_pairs = (
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
         "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        ("/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
         "/usr/share/fonts/dejavu/DejaVuSans.ttf"),
    )
    for bold_path, regular_path in font_pairs:
        if os.path.exists(bold_path):
            font_big = ImageFont.truetype(bold_path, 96)
            font_sub = ImageFont.truetype(regular_path, 28) if os.path.exists(regular_path) else font_big
            break

    family_tag = "macOS" if theme["family"] == "mac" else "Windows"
    text = "Silk"
    bbox = draw.textbbox((0, 0), text, font=font_big)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x, y = (W - tw) // 2, H - int(H * 0.14)
    draw.text((x + 3, y + 3), text, fill=(0, 0, 0, 100), font=font_big)
    draw.text((x, y), text, fill=(255, 255, 255, 230), font=font_big)
    sub = f"{theme['name']} · {family_tag}"
    sb = draw.textbbox((0, 0), sub, font=font_sub)
    sw = sb[2] - sb[0]
    draw.text(((W - sw) // 2, y + th + 12), sub, fill=(220, 230, 245, 180), font=font_sub)
    return lock.convert("RGB").resize((1920, 1080), Image.Resampling.LANCZOS)


def main() -> None:
    random.seed(42)
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {"desktop": [], "lock": [], "version": 2}

    for old in OUT.glob("silk-*-*.png"):
        old.unlink()

    for t in THEMES:
        did = t["id"]
        print(f"  {did} [{t['family']}] {t['name']} ({t['style']})")
        desk = render_desktop(t)
        lock = render_lock(t, desk)
        desk_path = OUT / f"silk-desktop-{did}.png"
        lock_path = OUT / f"silk-lock-{did}.png"
        desk.save(desk_path, "PNG", optimize=True)
        lock.save(lock_path, "PNG", optimize=True)
        entry = {
            "id": did, "family": t["family"], "name": t["name"], "desc": t["desc"],
            "style": t["style"], "file": desk_path.name,
        }
        manifest["desktop"].append(entry)
        manifest["lock"].append({**entry, "file": lock_path.name})

    (OUT / "silk-desktop.png").write_bytes((OUT / "silk-desktop-01.png").read_bytes())
    (OUT / "silk-lock.png").write_bytes((OUT / "silk-lock-01.png").read_bytes())
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Done: {len(THEMES)} desktop + {len(THEMES)} lock → {OUT}")


if __name__ == "__main__":
    main()
