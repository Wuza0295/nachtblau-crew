# NachtBlau GbR (nacht-blau.de)

Eigenständige GbR-Webseite auf ALL-INKL — **Allxion** liegt als Unterseite unter **`/allxion/`**.

## URLs

- GbR: https://nacht-blau.de/
- **Allxion:** https://nacht-blau.de/allxion/
- Projekte-Anker: https://nacht-blau.de/#projekte

## Sync mit ALL-INKL

**Ein Befehl (Tests + Allxion-Build für Linux/Android-Browser & PWA auf nacht-blau.de):**

```bash
pnpm sync:platforms              # lokal bauen
pnpm sync:platforms -- --upload    # zusätzlich FTPS-Upload (`.env.webspace`)
```

1. `.env.webspace.example` → `.env.webspace` (FTP-Zugang)
2. Allxion-Frontend bauen und ins Webspace-Verzeichnis legen:

```bash
pnpm webspace:build-allxion
```

3. Upload:

```bash
pnpm webspace:sync:nacht-blau
```

Optional: `VITE_API_ORIGIN` beim Build setzen, wenn das Backend auf Manus o.ä. läuft (Login, Feed-Daten).

Details: `allxion/README.md`
