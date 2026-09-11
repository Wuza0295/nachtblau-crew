# Sicherheit & Datenschutz (Silk)

## Kurzfassung

- **Kein Tracking:** Silk sendet keine Telemetrie an Nachtblau Crew.
- **Updates:** System-Updates über signierte Container (`bootc`, Cosign). App-Listen sind **lokal im Image**; Remote-Sync nur mit `SILK_CONFIG_URL=…`.
- **Schlüssel:** `cosign.key` gehört **nur** in GitHub Secrets – niemals ins Repo.

## Meldungen

Sicherheitslücken bitte per GitHub Issue (privat wenn möglich):  
https://github.com/Wuza0295/nachtblau-crew/security/advisories/new

## Datenschutz (Nutzer)

| Datenfluss | Anbieter | Wann | Zweck |
|------------|----------|------|--------|
| OS-Image / Updates | GitHub (ghcr.io) | `bootc upgrade` | System |
| Flatpak-Apps | Flathub | App-Installation | Software |
| Optional: Config-Sync | GitHub (raw) | nur mit `SILK_CONFIG_URL` | App-Aliase |
| Silk-Website | statisch | Besuch | keine Cookies/Tracking |

Silk speichert **keine** personenbezogenen Daten auf Servern der Nachtblau Crew.

Lokal: GPU/Hardware-Marker unter `/var/lib/silk/` (kein Upload).

## Entwickler / CI

- Container-Images werden mit Cosign signiert (`SIGNING_SECRET` erforderlich zum Publish).
- Kickstart `%post`: `bootc switch --enforce-container-sigpolicy`.
- Install-Skripte: keine `curl | bash` in Release-Artefakten; Skripte von Release laden + SHA256 prüfen.
- VirtualBox-Test-VM: Clipboard standardmäßig nur Host→Gast.

## Bekannte Grenzen

- Installer-UI (Anaconda) kann während der Installation noch Upstream-Texte zeigen; nach Reboot ist das System **Silk** (`PRETTY_NAME=Silk`).
- Build-Basis ist Open Source (Atomic/Fedora-Stack) – technisch, nicht als Produktname sichtbar.

Siehe auch: [`LEGAL.md`](LEGAL.md)
