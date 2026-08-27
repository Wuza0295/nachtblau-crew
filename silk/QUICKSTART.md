# Silk – Installation in 5 Minuten

> **Voraussetzung:** PC mit UEFI, Secure Boot optional (Aurora-kompatibel), Internet.
> Du brauchst **kein** Git auf dem Zielsystem – nur `bootc switch`.

Silk ist ein **unabhängiges Custom-Image** auf [Universal Blue Aurora](https://getaurora.dev/).
Kein macOS, kein Windows, kein offizielles Aurora-Produkt.

---

## 1. Ausgangssystem

Silk installierst du per **Rebase** von einem bestehenden Bootc-System:

| Startpunkt | OK? |
|------------|-----|
| [Universal Blue Aurora](https://getaurora.dev/) | ✅ empfohlen |
| Bazzite / Bluefin / anderer UBlue | ✅ |
| Fedora Atomic (Kinoite/Silverblue) | ✅ (mit `--enforce-container-sigpolicy`) |

---

## 2. Image wählen

| GPU | Befehl-Image |
|-----|----------------|
| **AMD / Intel** | `ghcr.io/wuza0295/silk:latest` |
| **NVIDIA** (Turing / GTX 16xx+, RTX) | `ghcr.io/wuza0295/silk-nvidia-open:latest` |

Unsicher? Später auf Silk: `silk-gpu status`

---

## 3. Installieren (Terminal)

### AMD / Intel

```bash
sudo bootc switch --enforce-container-sigpolicy ghcr.io/wuza0295/silk:latest
sudo systemctl reboot
```

### NVIDIA

```bash
sudo bootc switch --enforce-container-sigpolicy ghcr.io/wuza0295/silk-nvidia-open:latest
sudo systemctl reboot
```

Nach dem Neustart bist du auf **Silk**.

---

## 4. Erstlogin (automatisch)

Silk führt dich durch:

1. **Stil wählen** – Mac, Windows 11 oder Windows 10 (`silk-setup`)
2. **Alltags-Apps** – LibreOffice, Firefox, VLC, … (automatisch)
3. **Optional Gaming** – Steam, Heroic, Discord, …
4. **Willkommen** – `silk-welcome`

---

## 5. Wichtige Befehle

```bash
silk-welcome              # Kurzhilfe
silk-install datei.exe    # Smart-Installer
silk-desktop mac          # Stil wechseln
silk-wallpaper list       # Hintergründe
silk-update               # Apps + Listen aktualisieren
silk-update --full        # + System-Update (Reboot)
sudo bootc upgrade        # System-Image aktualisieren
```

---

## Updates

```bash
# Apps & Konfig-Listen
silk-update

# Komplett inkl. Silk-Image (Neustart nötig)
silk-update --full
# oder:
sudo bootc upgrade && sudo systemctl reboot
```

---

## Probleme?

| Symptom | Lösung |
|---------|--------|
| `bootc switch` schlägt fehl | `--enforce-container-sigpolicy` setzen; GHCR erreichbar? |
| NVIDIA schwarzer Bildschirm | `silk-nvidia-open`-Image nutzen, nicht `silk:latest` |
| `.exe` startet nicht | `silk-install datei.exe`; ggf. Bottles/Wine |
| Mac-App (.app) | Kein natives macOS – `silk-install` findet Flatpak-Ersatz |
| Zurück zu Aurora | `sudo bootc switch ghcr.io/ublue-os/aurora:stable` + Reboot |

Mehr: [`README.md`](README.md) · [`ROADMAP.md`](ROADMAP.md) · [`LEGAL.md`](LEGAL.md)

---

## Rechtlicher Hinweis

Silk ist ein Community-Projekt der Nachtblau Crew. Marken Dritter (Apple, Microsoft,
Fedora, Universal Blue, …) gehören ihren Inhabern. Software ohne Garantie („AS IS“).
