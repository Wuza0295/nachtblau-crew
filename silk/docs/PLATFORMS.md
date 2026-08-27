# Silk Multi-Plattform – Vollständige Übersicht

Silk ist ein **Ökosystem** mit Editionen pro Gerätetyp.

## Schnellstart je Gerät

| Gerät | Befehl | Image / Lösung |
|-------|--------|----------------|
| **PC / Laptop** | `silk-installer switch` | `ghcr.io/wuza0295/silk:latest` |
| **PC NVIDIA** | `silk-installer switch` | `ghcr.io/wuza0295/silk-nvidia-open:latest` |
| **Tablet / 2-in-1** | `silk-tablet setup` | Gleiches PC-Image + Touch-Layout |
| **MacBook M1+** | `silk-asahi install` | `ghcr.io/wuza0295/silk-asahi:latest` |
| **Intel-MacBook** | `silk-asahi intel-mac` | Kein natives Silk – Alternativen |
| **Android-Phone** | `silk-mobile android` | KDE Connect + silk-connect |
| **iPhone / iPad** | `silk-connect setup` | Begleiter-PWA (kein natives iOS) |
| **Linux-Phone** | `silk-mobile install` | postmarketOS / Mobian |

**Universal:** `silk-platform setup` erkennt dein Gerät automatisch.

---

## Architektur

```
                    ┌─────────────────────────────┐
                    │   Silk (Marke + silk-* CLI)  │
                    └─────────────────────────────┘
         ┌──────────┬──────────┬──────────┬──────────────┐
         ▼          ▼          ▼          ▼              ▼
    Silk PC    Silk Tablet  Silk Asahi  Silk Mobile   Silk Connect
    (Aurora)   (Touch)      (Mac M1+)   (Linux Phone) (iOS/Android)
```

---

## PC (vollwertig) ✅

- Installation: `silk-installer` oder USB-ISO (`just build-iso`)
- Desktop: Mac / Win11 / Win10
- Gaming, GPU, Smart-Installer
- Doku: [`QUICKSTART.md`](../QUICKSTART.md), `silk-platform guide pc`

## Tablet (vollwertig) ✅

- Touch-Layout: `silk-desktop tablet` / `silk-tablet setup`
- Bildschirmtastatur (Maliit), KDE Connect
- Für: Surface, Yoga, Touch-Laptops
- Doku: `silk-platform guide tablet`

## Mac / MacBook Apple Silicon (silk-asahi) ⚠️ experimentell

1. [Fedora Asahi Remix](https://fedora-asahi-remix.org/) in macOS installieren
2. `silk-asahi switch` → Silk-Image
3. `silk-asahi setup` → Mac-Optik + Apps
4. Updates: `bootc upgrade` + `update-m1n1`

Image: `ghcr.io/wuza0295/silk-asahi:latest`

## Intel-MacBook ❌ (mit Alternativen)

- Kein natives Silk (T2, WLAN, Firmware)
- `silk-asahi intel-mac` – Migration, Dual-Boot-Hinweise, Connect

## Smartphone

### Android
- **Apps auf Silk-PC:** Waydroid + `silk-install .apk`
- **Phone als Begleiter:** KDE Connect + `silk-connect`

### iPhone / iPad
- **Kein Silk-OS** – nur `silk-connect` (Dashboard, Remote, Kiosk)

### Linux-Phone (PinePhone, Pixel, …)
- postmarketOS / Mobian: `silk-mobile install`
- `silk-mobile devices` – unterstützte Geräte

---

## Diagnose

```bash
silk-platform detect
silk-doctor
silk-hardware status
```

---

## Grenzen (ehrlich)

| Anspruch | Realität |
|----------|----------|
| „Ein Image für alles“ | Nein – verschiedene Images (PC, Asahi) |
| „Silk auf iPhone“ | Nein – Connect als Begleiter |
| „Silk auf Intel-Mac“ | Nein – PC oder Asahi-Mac |
| „Jedes Android-Phone“ | Nein – nur Unlock + pmOS-Geräteliste |

---

*Siehe auch: [`CONNECT.md`](CONNECT.md) · [`../ROADMAP.md`](../ROADMAP.md)*
