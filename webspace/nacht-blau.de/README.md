# NachtBlau GbR (nacht-blau.de)

Eigenständige GbR-Webseite auf ALL-INKL — **Allxion** liegt als Unterseite unter **`/allxion/`**.

## URLs

- GbR: https://nacht-blau.de/
- **Allxion:** https://nacht-blau.de/allxion/
- Projekte-Anker: https://nacht-blau.de/#projekte

## Sync mit ALL-INKL

1. `.env.webspace.example` → `.env.webspace` (FTP-Zugang aus ALL-INKL Members Area)
2. Alles vom Webspace ziehen:

```bash
pnpm webspace:connect   # FTPS-Test
pnpm webspace:pull      # alle Domains → webspace/<domain>/
pnpm webspace:pull nacht-blau.de
```

3. Optional zurückschreiben:

```bash
pnpm webspace:sync                    # alle lokalen Domains → Remote
pnpm webspace:sync:one nacht-blau.de  # nur GbR
```

Die gehashten Allxion-Build-Assets (`allxion/assets/`) bleiben lokal (gitignore) und werden
über `pnpm webspace:pull` aktualisiert — nicht ins Git-Repo gelegt.

**Plattform-Sync (Linux / Android / Web):** siehe `references/platform-sync.md` und
`pnpm sync:platforms` (Build → `webspace/…/allxion/` → FTPS).
