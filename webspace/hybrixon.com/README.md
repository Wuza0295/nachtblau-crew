# Hybrixon

Eigenständiges Social-Portal auf dem ALL-INKL-Webspace.

**Live:** https://hybrixon.com/

## Optik / Marke

Warme Anthrazit-Basis, Hybrid-Akzent Teal ↔ Amber, Schriften Oxanium / Sora / DM Sans.
Keine NachtBlau-Branding-Farben in der UI. Logo unter `assets/img/logo.svg` nicht ersetzen.

## Deploy

```bash
# Zugangsdaten in .env.webspace
pnpm webspace:sync:one hybrixon.com
```

Oder gesamter Account: `pnpm webspace:sync`

Composer-Abhängigkeiten (`vendor/`) und APKs werden lokal nicht versioniert — auf dem Server belassen bzw. `composer install` / Downloads separat pflegen.

## Admin

`/admin/` (nur als berechtigter Admin eingeloggt)
