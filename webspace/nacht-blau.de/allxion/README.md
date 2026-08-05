# Allxion auf nacht-blau.de

Unterseite: **https://nacht-blau.de/allxion/**

## Build & Upload

```bash
# Optional: API-Backend (Manus Deploy) für Login/Daten
# export VITE_API_ORIGIN=https://dein-backend.example

pnpm webspace:build-allxion
pnpm webspace:sync:nacht-blau
```

Ohne Build liegt eine Platzhalter-`index.html` bereit.

## Technik

- Vite `base`: `/allxion/`
- Apache `.htaccess` mit `RewriteBase /allxion/`
- GbR-Startseite verlinkt `/allxion/` unter **Projekte**
