# Silk Roadmap – 1.0 → 2.0

Stand: August 2026 · Produkt: **Silk** (Custom Bootc-Image auf Universal Blue Aurora)

Diese Roadmap beschreibt, was **fertig ist**, was für einen **öffentlichen Launch (1.0)** fehlt,
und wohin **Silk 2.0** langfristig gehen kann.

> Silk ist ein **eigenes Produkt**, kein Aurora-Klon. Technische Basis bleibt Open Source
> (Aurora → Fedora → Linux). Siehe [`LEGAL.md`](LEGAL.md) für Vermarktung & Marken.

---

## Ist-Stand (bereits implementiert)

| Bereich | Status | Details |
|---------|--------|---------|
| **Image-Build** | ✅ | Containerfile, CI (täglich), `silk` + `silk-nvidia-open` |
| **Desktop-Stil** | ✅ | Mac / Win11 / Win10 via `silk-desktop`, WhiteSur + Fluent |
| **Smart-Installer** | ✅ | `.exe`, `.apk`, `.dmg`, `.app`, `.deb`, `.rpm`, `.snap`, AppImage |
| **Erstlogin** | ✅ | `silk-setup`, Essentials auto, optional Gaming |
| **Wechsler-Komfort** | ✅ | NTFS/exFAT, SMB, Fonts, MIME-Handler, `silk-welcome` |
| **GPU** | ✅ | AMD/Intel/NVIDIA, `silk-gpu`, zwei Image-Varianten |
| **Hardware-Erkennung** | ✅ | `silk-hardware` (PC / Intel-Mac / Apple Silicon) |
| **Hintergründe** | ✅ | 20× Desktop + 20× Sperrbild, `silk-wallpaper` |
| **Updates** | ✅ | `silk-update`, `silk-sync-config`, bootc upgrade |
| **Tests** | ✅ | Offline-Suite (~140 Checks) |
| **Dokumentation** | ⚠️ | README, PDF, LEGAL/NOTICE – Website fehlt |
| **Rechtliches** | ⚠️ | LEGAL.md/NOTICE vorhanden – Impressum/Website fehlt |

---

## Silk 1.0 – „Öffentlicher Launch“

**Ziel:** Nutzer können Silk **ohne Git-Kenntnisse** installieren, verstehen und nutzen.
Ihr dürft es **marketing-tauglich** als eigenes Produkt bewerben (mit Disclaimer).

### Must-Have (Blocker)

- [ ] **PR `cursor/aurora-silk-os-2818` mergen** → vollständiges `silk/` auf `main`
- [ ] **CI grün** – beide Images (`silk`, `silk-nvidia-open`) bauen & pushen
- [ ] **SIGNING_SECRET** in GitHub Actions (Cosign) – Images signiert
- [ ] **GHCR public** – `ghcr.io/wuza0295/silk:latest` für alle pullbar
- [ ] **Install-Anleitung (1 Seite)** – bootc switch + Reboot, NVIDIA-Variante
- [ ] **Landing Page** – getsilk.* oder Unterseite mit:
  - Was ist Silk / was nicht (kein macOS/Windows, kein offizielles Aurora)
  - Download/Install (bootc-Befehl)
  - Impressum + Datenschutz (DE)
  - Haftungsausschluss + Marken-Disclaimer (→ [`LEGAL.md`](LEGAL.md))
- [ ] **Smoke-Test auf echter Hardware** – AMD/Intel-PC + optional NVIDIA
- [ ] **`cosign.key` aus Repo entfernen** – nur in GitHub Secrets

### Should-Have (Launch-Qualität)

- [ ] **ISO oder Anaconda-Image** (`just build-iso`) für USB-Installation
- [ ] **Erstlogin polieren** – Stil-Wahl, Essentials, Welcome ohne Fehler
- [ ] **Fehlerseiten** – was tun wenn `bootc switch` scheitert
- [ ] **FAQ** – 10 häufigste Fragen (Mac-Apps, .exe, Gaming, Updates)
- [ ] **Screenshots/Video** – Mac-Layout, Win11-Layout, silk-install Demo
- [ ] **ArtifactHub-Eintrag** – Image auffindbar (Justfile-Labels vorhanden)

### Nice-to-Have (kann nach Launch)

- [ ] Automatischer Update-Hinweis (`silk-update --full` Timer)
- [ ] Discord/Matrix-Link für Community
- [ ] Englische README-Seite

---

## Silk 1.x – Stabilisierung & Wachstum

**Ziel:** Vertrauen aufbauen, Bugs fixen, Wechsler-Feedback einarbeiten.

| Milestone | Inhalt |
|-----------|--------|
| **1.1 Stabilität** | CI-Reproduzierbarkeit, Kernel-Regression-Tests, Issue-Template |
| **1.2 Installer+** | Bessere App-Aliase, mehr Flatpak-Fallbacks, Bottles/Waydroid Auto-Setup |
| **1.3 Gaming** | ProtonUp-Integration, GameMode-Defaults pro GPU, Anti-Cheat-Hinweise |
| **1.4 Docs** | Vollständige Nutzer-Doku (DE), Troubleshooting, `silk-doctor` Diagnose-Skript |
| **1.5 Legal** | NOTICE vervollständigen, Markenrecherche „Silk“, optional Anwalt-Review |

---

## Silk 2.0 – Vision (größere Schritte)

**Ziel:** Silk fühlt sich wie **ein fertiges Consumer-OS** an – ohne Fedora/Aurora sichtbar zu machen.

| Feature | Beschreibung | Abhängigkeit |
|---------|--------------|--------------|
| **Silk-Website + Account** | Download, Changelog, optional Nutzer-Forum | Hosting |
| **Silk-Installer (GUI)** | Grafischer Assistent statt nur Terminal/bootc | Entwicklung |
| **ISO-First-Install** | USB-Stick → Silk, ohne vorher Aurora zu kennen | bootc-image-builder |
| **Silk-Asahi** | Apple-Silicon-Image auf Fedora Asahi Remix atomic | Asahi-Base stabil |
| **Eigene App-Store-UI** | Warehouse/Flatpak hübsch eingebettet, „Silk Store“ | UI-Arbeit |
| **Cloud-Sync Config** | Listen/Aliase zentral, opt-in Telemetrie-frei | Backend optional |
| **Silk OEM** | Vorinstalliert auf Hardware (Nachtblau-Laptop?) | Partner/Hardware |
| **Eigene Fedora-Base** | Weniger Abhängigkeit von UBlue (nur bei Bedarf) | Hoher Pflegeaufwand |

> **2.0 heißt nicht „OS von Null“** – sondern: Silk ist für Nutzer das gesamte Erlebnis,
> Upstream ist unsichtbare Infrastruktur.

---

## Prioritäten-Matrix

```
                    Wirkung hoch
                         │
     Landing Page        │    PR mergen + CI
     Install-Anleitung   │    Smoke-Test Hardware
                         │
  ───────────────────────┼─────────────────────── Aufwand hoch
                         │
     FAQ + Screenshots    │    silk-asahi (2.0)
     ISO-Installer        │    Eigene Fedora-Base
                         │
                    Wirkung niedrig
```

**Als Nächstes (Reihenfolge):**

1. PR #17 / `cursor/aurora-silk-os-2818` → `main` mergen
2. CI + signierte Images verifizieren
3. Install-Anleitung + 1-Seiten-Quickstart
4. Minimale Landing Page (Impressum, Disclaimer, bootc-Befehl)
5. Hardware-Smoke-Test
6. Launch

---

## Launch-Checkliste (Copy-Paste)

```text
[ ] silk + silk-nvidia-open Images auf GHCR erreichbar
[ ] bootc switch auf Test-PC erfolgreich
[ ] silk-setup Erstlogin durchlaufen
[ ] silk-install .exe / .app / .deb getestet
[ ] silk-desktop mac + windows11 getestet
[ ] silk-gpu / silk-hardware ohne Fehler
[ ] Website online mit Impressum + Datenschutz
[ ] README + PDF verlinkt
[ ] Kein cosign.key im Repo
[ ] LEGAL.md Disclaimer auf Website
```

---

## Was Silk bewusst **nicht** wird

- Kein macOS-/Windows-Klon (rechtlich/technisch)
- Kein OS für MacBook-Hardware (1.0) – ggf. 2.0 via Asahi
- Kein Ersatz für professionellen Anti-Cheat-/DRM-Support
- Keine Garantie für jede `.exe`-Datei

---

## Referenzen

| Dokument | Zweck |
|----------|-------|
| [`README.md`](README.md) | Technische Übersicht |
| [`LEGAL.md`](LEGAL.md) | Vermarktung & Marken |
| [`NOTICE`](NOTICE) | Third-Party-Lizenzen |
| [`Silk-Zusammenfassung.pdf`](../Silk-Zusammenfassung.pdf) | Produkt-PDF (Repo-Root) |
| [`docs/silk-produktuebersicht.html`](docs/silk-produktuebersicht.html) | PDF-Vorlage |

---

*Nachtblau Crew · Silk is built on Universal Blue Aurora.*
