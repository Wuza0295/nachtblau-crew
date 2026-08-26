#!/usr/bin/env python3
"""Generate Silk feature summary PDF (German)."""
from __future__ import annotations

from datetime import date
from pathlib import Path

from fpdf import FPDF

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
OUT = Path("/opt/cursor/artifacts/silk-zusammenfassung.pdf")


class SilkPDF(FPDF):
    def footer(self) -> None:
        self.set_y(-15)
        self.set_font("DejaVu", "", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Silk – Stand {date.today().isoformat()}  |  Seite {self.page_no()}", align="C")


def section(pdf: SilkPDF, title: str) -> None:
    pdf.ln(4)
    pdf.set_font("DejaVu", "B", 13)
    pdf.set_text_color(30, 60, 120)
    pdf.multi_cell(0, 8, title)
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("DejaVu", "", 10)
    pdf.ln(1)


def bullet(pdf: SilkPDF, text: str) -> None:
    pdf.set_x(12)
    pdf.multi_cell(0, 5.5, f"• {text}")


def code(pdf: SilkPDF, text: str) -> None:
    pdf.set_font("DejaVu", "", 9)
    pdf.set_fill_color(245, 245, 245)
    pdf.set_x(12)
    pdf.multi_cell(0, 5, text, fill=True)
    pdf.set_font("DejaVu", "", 10)


def main() -> None:
    pdf = SilkPDF()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_font("DejaVu", "", FONT)
    pdf.add_font("DejaVu", "B", FONT_BOLD)
    pdf.add_page()

    # Titel
    pdf.set_font("DejaVu", "B", 22)
    pdf.set_text_color(25, 45, 90)
    pdf.cell(0, 14, "Silk", ln=True)
    pdf.set_font("DejaVu", "", 14)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(0, 8, "Zusammenfassung – Was Silk bereits kann", ln=True)
    pdf.ln(2)
    pdf.set_font("DejaVu", "", 10)
    pdf.set_text_color(0, 0, 0)
    pdf.multi_cell(
        0,
        5.5,
        "Silk ist ein Custom-Bootc-Image auf Basis von Universal Blue Aurora (KDE Plasma). "
        "Zielgruppe: Wechsler von Windows und macOS – mit wählbarer Optik, Smart-Installer "
        "für gängige Dateiformate und Gaming-Tauglichkeit auf PC-Hardware.",
    )

    section(pdf, "1. Kernidee")
    bullet(pdf, "Eigenständiges Linux-OS als OCI-Image (bootc), kein macOS/Windows-Klon")
    bullet(pdf, "Leicht, gaming-tauglich, AMD/Intel/NVIDIA auf PC-Hardware")
    bullet(pdf, "Images: ghcr.io/wuza0295/silk:latest und ghcr.io/wuza0295/silk-nvidia-open:latest")
    bullet(pdf, "Täglicher CI-Rebuild mit frischem Aurora-Upstream")

    section(pdf, "2. Desktop-Stil (Mac / Windows)")
    bullet(pdf, "silk-desktop mac – Menüleiste + Dock (WhiteSur-Theme)")
    bullet(pdf, "silk-desktop windows11 – zentrierte Taskleiste (Fluent)")
    bullet(pdf, "silk-desktop windows10 – klassische Taskleiste links")
    bullet(pdf, "silk-setup – Erstlogin: Stil wählen, Essentials auto, optional Gaming")
    bullet(pdf, "silk-apply-layout / silk-apply-wallpaper – Layout + Hintergrund anwenden")

    section(pdf, "3. Smart-Installer (silk-install)")
    pdf.multi_cell(0, 5.5, "Flatpak wird bevorzugt; sonst Wine, Waydroid oder Distrobox:")
    rows = [
        (".exe / .msi", "Flatpak → Wine / Bottles"),
        (".apk", "Flatpak → Waydroid"),
        (".dmg / .pkg / .app", "Flatpak-Gegenstück (App-Aliase)"),
        (".AppImage", "Flatpak → Gear Lever / ~/Applications"),
        (".deb", "Flatpak → Ubuntu-Distrobox (silk-ubuntu)"),
        (".rpm", "Flatpak → rpm-ostree / Fedora-Box (silk-fedora)"),
        (".snap", "Flatpak → Snap in Ubuntu-Box"),
        (".flatpak / .flatpakref", "flatpak install"),
    ]
    pdf.ln(1)
    pdf.set_font("DejaVu", "B", 9)
    for left, right in rows:
        pdf.set_x(12)
        pdf.cell(42, 5.5, left)
        pdf.set_font("DejaVu", "", 9)
        pdf.cell(0, 5.5, right, ln=True)
        pdf.set_font("DejaVu", "B", 9)
    pdf.set_font("DejaVu", "", 10)
    pdf.ln(1)
    code(pdf, "silk-install --setup-essentials | --setup-gaming | --ensure-boxes")

    section(pdf, "4. Alltags-Apps (Essentials)")
    essentials = (
        "LibreOffice, Firefox, VLC, Thunderbird, Okular, Gwenview, Bitwarden, Dropbox, "
        "Rclone, Zoom, Teams, Slack, Pika Backup, Gear Lever, Warehouse, Flatseal"
    )
    pdf.multi_cell(0, 5.5, essentials)

    section(pdf, "5. Gaming")
    gaming = (
        "Steam, Steam Link, Heroic, itch.io, Lutris, Bottles, Protontricks, Discord, OBS, "
        "Spotify, Moonlight, Chiaki, GeForce Now, Prism Launcher (Minecraft), osu!, "
        "RetroArch, Dolphin, PPSSPP, MangoHud, GameMode, gamescope"
    )
    pdf.multi_cell(0, 5.5, gaming)
    code(pdf, "silk-install --setup-gaming")

    section(pdf, "6. GPU-Unterstützung")
    bullet(pdf, "AMD: Mesa/RADV, amd-gpu-firmware, radeontop – silk:latest")
    bullet(pdf, "Intel: intel-gpu-firmware, intel-media-driver, i915/Xe – silk:latest")
    bullet(pdf, "NVIDIA (Turing/16xx+): silk-nvidia-open auf aurora-nvidia-open Basis")
    code(pdf, "silk-gpu status | hints | detect")

    section(pdf, "7. Mac / MacBook")
    bullet(pdf, "Wechsel von macOS auf PC: Mac-Optik, .dmg/.app-Installer, App-Aliase (Safari→Firefox …)")
    bullet(pdf, "Silk auf Intel-MacBook: nicht offiziell unterstützt")
    bullet(pdf, "Silk auf Apple Silicon (M1+): nicht unterstützt – Fedora Asahi Remix als Alternative")
    code(pdf, "silk-hardware status | hints | detect")

    section(pdf, "8. Hintergründe (20× Desktop + 20× Sperrbild)")
    bullet(pdf, "Mac-inspiriert (01–10): Big Sur, Monterey, Ventura, Sonoma, …")
    bullet(pdf, "Windows-inspiriert (11–20): Win11 Bloom, Win10 Hero, Fluent Dark, …")
    code(pdf, "silk-wallpaper list [mac|win] | set mac 03 | set win 14 | random win")

    section(pdf, "9. Wechsler-Komfort")
    bullet(pdf, "NTFS + exFAT, SMB-Client, CUPS-Druck")
    bullet(pdf, "Fonts: Liberation, Noto, MS-Core (wo verfügbar)")
    bullet(pdf, "MIME-Handler: Doppelklick auf .exe, .apk, .dmg, .deb, AppImage …")
    bullet(pdf, "silk-welcome – HTML-Kurzhilfe für Umsteiger")
    bullet(pdf, "silk-sync-config – App-Listen & Aliase vom GitHub-Repo")

    section(pdf, "10. Wichtige Befehle")
    cmds = [
        "silk-setup / silk-welcome / silk-desktop",
        "silk-install <datei> / --setup-essentials / --setup-gaming",
        "silk-update / silk-update --full / silk-sync-config",
        "silk-gpu status / silk-hardware status",
        "silk-wallpaper list / set / random",
        "sudo bootc switch ghcr.io/wuza0295/silk:latest",
        "sudo bootc upgrade && reboot",
    ]
    for c in cmds:
        bullet(pdf, c)

    section(pdf, "11. Grenzen (ehrlich)")
    bullet(pdf, "Kein natives macOS/Windows – Optik angelehnt, keine Markenassets")
    bullet(pdf, "Mac-Apps (.app) laufen nicht nativ – Linux-Ersatz via Flatpak")
    bullet(pdf, "Nicht jedes .exe (Anti-Cheat, DRM, spezielle Treiber)")
    bullet(pdf, "Kein Silk auf MacBook-Hardware (Intel-Mac / Apple Silicon)")

    pdf.ln(6)
    pdf.set_font("DejaVu", "", 9)
    pdf.set_text_color(80, 80, 80)
    pdf.multi_cell(
        0,
        5,
        "Quelle: Silk-Projekt (Universal Blue Aurora) · Repo: wuza0295/nachtblau-crew · "
        "Dokument automatisch generiert.",
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUT))
    print(f"PDF erstellt: {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
