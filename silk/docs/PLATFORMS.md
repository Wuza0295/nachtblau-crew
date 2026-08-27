# Silk Multi-Plattform – Strategie

Silk ist ein **Ökosystem** mit mehreren Editionen – nicht ein einziges Image für alle Geräte.

## Plattform-Matrix

| Plattform | Silk-Edition | Status | Hinweis |
|-----------|--------------|--------|---------|
| **PC / Laptop** (x86, AMD/Intel/NVIDIA) | Silk Desktop | ✅ Jetzt | `ghcr.io/wuza0295/silk:latest` |
| **Tablet / 2-in-1** (Touch, x86) | Silk Desktop + Tablet-Modus | ✅ Jetzt | `silk-desktop tablet` |
| **Mac (Apple Silicon)** | Silk Mac (Asahi) | 🔜 Geplant | Fedora Asahi Remix Basis |
| **Mac (Intel)** | – | ❌ Nein | T2/WLAN/Firmware |
| **Android-Smartphone** | Silk Mobile | 🔜 Vision | postmarketOS / Mobian |
| **iPhone / iPad** | Silk Connect | ✅ Jetzt | Begleit-PWA, kein natives OS |
| **iPad (nativ)** | – | ❌ Nein | Apple Bootloader gesperrt |

## Architektur

```
┌─────────────────────────────────────────────────────────┐
│              Silk Ökosystem (Marke + Sync)               │
│   silk-sync-config · Themes · silk-install · Connect    │
└─────────────────────────────────────────────────────────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
 Desktop         Tablet          Mac           Connect
 (Aurora)    (Touch-Layout)   (Asahi)      (PWA/iOS)
```

## Editionen im Detail

### Silk Desktop (jetzt)
- Basis: Universal Blue Aurora, KDE Plasma 6
- Ziel: Umsteiger von Windows/macOS auf PC
- Befehle: `silk-setup`, `silk-install`, `silk-desktop`

### Silk Tablet (jetzt)
- Gleiches Image wie Desktop
- Touch-Layout: `silk-desktop tablet`
- Für Convertibles, Surface-ähnliche Geräte, große Touch-Displays

### Silk Connect (jetzt)
- Für iPhone, iPad, Android-Browser
- `silk-connect setup` auf dem Silk-PC
- Alte Apple-Hardware bleibt als Begleiter nutzbar

### Silk Mac / silk-asahi (geplant)
- Basis: Fedora Asahi Remix (atomic)
- Nur Apple Silicon (M1/M2/M3/M4)
- Gemeinsame Themes und `silk-install`-Logik

### Silk Mobile (Vision)
- Nur ausgewählte Geräte (z. B. Pixel, OnePlus)
- Eigene Mobile-Shell, nicht KDE Plasma Desktop
- Langfristig, hoher Pflegeaufwand

## Was bewusst nicht geht

- **Silk auf iPad installieren** – technisch und rechtlich blockiert
- **Native macOS-Apps** – nur Ersatz via Flatpak-Aliase
- **Jedes Android-Phone** – Treiber-Chaos wie bei Custom ROMs
- **Ein Image für alles** – verschiedene CPU (x86 vs ARM) und Formfaktoren

## Roadmap-Priorität

1. ✅ Silk Desktop 1.0 (Merge, CI, Website)
2. ✅ Silk Connect + Tablet-Modus
3. 🔜 ISO-Installer, FAQ, Landing Page
4. 🔜 silk-asahi (Mac ARM)
5. 🔜 Silk Mobile (Nische)

---

*Nachtblau Crew · Silk*
