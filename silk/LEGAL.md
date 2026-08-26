# Silk – Rechtliche Hinweise (Website & Vermarktung)

> **Keine Rechtsberatung.** Vor Launch einer öffentlichen Website Impressum,
> Datenschutz und Markenfragen mit einem Anwalt prüfen.

## Was Silk ist

Silk ist ein **unabhängiges Custom-Linux-Image** der Nachtblau Crew, gebaut auf
[Universal Blue Aurora](https://getaurora.dev/). Silk ist **weder** ein offizielles
Produkt von Universal Blue, Fedora, Apple noch Microsoft.

## Erlaubte Formulierungen (Website)

- „Silk – Linux für Umsteiger von Windows und macOS“
- „Mac- und Windows-**inspirierte** Optik (Open-Source-Themes)“
- „Gebaut auf Universal Blue Aurora“
- „Custom Bootc-Image, quelloffen (Apache-2.0 für Silk-Layer)“

## Zu vermeidende Formulierungen

| ❌ Nicht | ✅ Stattdessen |
|---------|----------------|
| Offizielles Aurora-Produkt | Unabhängiges Image **auf Basis von** Aurora |
| Aurora Silk / Fedora Silk | **Silk** (eigener Produktname) |
| macOS für PC / Windows-Ersatz | Optik **inspiriert von** macOS/Windows |
| Apple-/Microsoft-Logos | Eigene Silk-Grafik, Theme-Screenshots ohne Markenlogos |
| „Wir besitzen alle Rechte“ | „Open-Source-Komponenten, siehe NOTICE“ |

## Pflicht-Inhalte für eine Silk-Webseite (DE/EU)

1. **Impressum** (Name, Adresse, Kontakt – § 5 TMG)
2. **Datenschutzerklärung** (Cookies, Analytics, GHCR-Downloads)
3. **Haftungsausschluss:** Software „AS IS“, keine Garantie
4. **Marken-Disclaimer** (siehe NOTICE)
5. **Lizenzhinweis:** Apache-2.0 + Link zum Git-Repository
6. **Kein Ersatz für macOS/Windows** – klar sichtbar

## Beispiel-Disclaimer (Startseite)

```text
Silk ist ein Community-Projekt der Nachtblau Crew. Silk basiert technisch auf
Universal Blue Aurora und Fedora. Silk ist kein macOS, kein Windows und kein
offizielles Produkt von Apple, Microsoft, Fedora oder Universal Blue.
Marken gehören ihren jeweiligen Inhabern.
```

## Marke „Silk“

Vor größerer Vermarktung: Markenrecherche (DPMA/EUIPO). Der Name „Silk“ kann
bereits anderweitig geschützt sein.

## Verteilung des Images

- Container-Image: `ghcr.io/wuza0295/silk:latest`
- NVIDIA-Variante: `ghcr.io/wuza0295/silk-nvidia-open:latest`
- Quellcode: GitHub-Repository `nachtblau-crew`

## Sicherheit

`cosign.key` und andere Signing-Keys **niemals** ins Git-Repository committen.
