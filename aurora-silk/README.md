# Aurora Silk

Custom-Bootc-Image auf [Aurora](https://getaurora.dev/) für **Wechsler von macOS und Windows** – Optik wählbar, Programme möglichst „wie vorher“ nutzbar.

> Kein macOS und kein Windows. Open-Source-Themes (WhiteSur / Fluent) und Kompatibilitätsschichten – keine Apple-/Microsoft-Markenassets oder -Logos.

## Name (Empfehlung)

**Favorit: Aurora Silk / Silk** – behalten.

| Kriterium | Bewertung |
|-----------|-----------|
| Kurz & merkbar | „Silk“ ist ein Wort, leicht auszusprechen (DE/EN) |
| Markenrisiko Apple/MS | Kein Mac/iOS/Windows/Win11/Aqua/Soft – geringes Verwechslungsrisiko |
| Bezug zu Upstream | „Aurora“ kennzeichnet klar die Universal-Blue-Basis |

Leichte Risiken: „Silk“ allein ist generisch; „Aurora“ ist der Upstream-Produktname (kein Apple/MS). Kein Alternativname ist klar besser – deshalb **keine Umbenennung**.

### Weitere Kandidaten (falls später Rebrand)

1. **Lumen** – kurz, DE/EN, keine OS-Marken
2. **Nordlicht** – Aurora-Anklang ohne Markenkopie
3. **Cascade** – flüssig, technisch neutral
4. **Borealis** – Polarlicht-Motiv, distinkt
5. **Velvet** – weich/Desktop-Feel, generisch
6. **Loom** – „Schicht weben“ über Aurora
7. **Quill** – leicht, werkzeugartig

## Desktop-Stil

Beim ersten Login fragt Silk, woher du kommst:

| Befehl | Optik |
|--------|--------|
| `silk-desktop mac` | Menüleiste + Dock |
| `silk-desktop windows11` | zentrierte Taskleiste |
| `silk-desktop windows10` | klassische Taskleiste links |
| `silk-desktop --ask` | Dialog erneut |

## Programme „wie vorher“

`silk-install` / Doppelklick:

| Datei | Verhalten |
|-------|-----------|
| `.exe` / `.msi` | Flatpak-Gegenstück suchen → sonst Bottles/Wine |
| `.apk` | Flatpak → sonst Waydroid |
| `.dmg` / `.pkg` / `.app` | Flatpak-Gegenstück (Mac-Binaries laufen **nicht**) |

```bash
silk-install DiscordSetup.exe
silk-install Firefox.app
silk-install GoogleChrome.dmg
silk-install --setup-gaming
silk-install --search notion
```

Bekannte Zuordnungen liegen in `usr/share/silk/app-aliases.json` (z. B. Safari→Firefox, Explorer→Dolphin, Word→LibreOffice).

## Basis & Updates

- **Base-Image:** `ghcr.io/ublue-os/aurora:stable` (AMD/Open, KDE) – **floating Tag**, absichtlich **nicht** per Digest gepinnt
- CI baut **täglich** neu (`cron` + Push/PR) und zieht mit `--pull=always` die aktuelle Aurora-`stable`
- Silk-Layer (Themes, Helfer, Gaming-Flatpaks) liegen **oben** auf Aurora; Upstream-Fixes kommen mit dem nächsten Image-Build

### Updates einspielen

Nach dem Rebase auf Silk kommen System-Updates wie bei Aurora / Universal Blue:

```bash
# empfohlen (bootc)
sudo bootc upgrade
sudo systemctl reboot

# Alternative über ujust (Aurora/ublue)
ujust update

# oder rpm-ostree
rpm-ostree upgrade
sudo systemctl reboot
```

Damit holst du das neueste **Silk**-Image von GHCR (inkl. frischem Aurora-Base + Silk-Layer). Flatpak-Apps aktualisieren sich separat (`flatpak update` bzw. über die GUI).

### Aurora vs. Bazzite

| | Aurora Silk | Bazzite |
|--|-------------|---------|
| Base | **nur** Aurora (`FROM aurora:stable`) | eigenes Gaming-Image |
| Auto-Updates | Aurora-`stable` wird getrackt | nicht als Base |
| Gaming | ausgewählte Bazzite-*ähnliche* Pakete/Flatpaks im Silk-Layer | gaming-stärker out of the box |

Silk bleibt Aurora-basiert (ein Base – niemals `FROM` Aurora **und** Bazzite). Wer maximale Gaming-Integration will, ist mit [Bazzite](https://bazzite.gg/) oft besser bedient; Silk kann einzelne Ideen (Steam, Heroic, GameMode, …) spiegeln, ohne Bazzite als Base zu übernehmen.

## Was im Image steckt

- AMD/Lightweight: Sysctl, NVMe-Kyber, Mesa/RADV
- Gaming (Win/Mac-Äquivalente): Steam, Steam Link, Heroic (Epic/GOG), itch.io, Discord, OBS, Minecraft (Prism), osu!, RetroArch, Dolphin, PPSSPP, Moonlight, Chiaki, GeForce Now, Bottles/Lutris + GameMode/MangoHud

## Build / Rebase

1. Cosign-Secret `SIGNING_SECRET` setzen (`cosign.key` – **nicht** committen)
2. `silk.env` → `REPO_ORGANIZATION`
3. CI baut → rebase:

```bash
sudo bootc switch ghcr.io/<user>/aurora-silk:latest
sudo systemctl reboot
```

Lokal: `cd aurora-silk && just build aurora-silk latest`

## Grenzen (ehrlich)

- Mac-Apps starten nicht nativ; Silk sucht Linux-Ersatz.
- Nicht jedes `.exe` läuft (Anti-Cheat, Treiber, DRM).
- Optik ist angelehnt, kein 1:1-Klon von macOS/Windows.

## Tests

```bash
bash aurora-silk/tests/run-offline-tests.sh
```
