# NachtBlau GbR (nacht-blau.de)

Eigenständige GbR-Webseite auf ALL-INKL — getrennt von **NachtBlau Crew** und **Allxion**.

## Inhalt

- Unternehmensprofil (GbR)
- **§3 Digitale Projekte** — Link zu **Allxion** (Social-Hub)
- Impressum & Datenschutz

## Lokal

```bash
cd webspace/nacht-blau.de
python3 server.py
```

→ http://localhost:8080

## Sync mit ALL-INKL

1. `.env.webspace.example` → `.env.webspace` kopieren, FTP-Daten eintragen
2. **`WEBSPACE_ALLXION_URL`** = öffentliche URL eurer deployten App (Manus Space o.ä.)
3. Upload:

```bash
pnpm webspace:sync:nacht-blau
```

Prüfen: https://nacht-blau.de/ → Navigation **Projekte** / Footer **Allxion**

Die App verlinkt zurück auf https://nacht-blau.de/#projekte (`ALLXION.webspaceProjectsUrl`).
