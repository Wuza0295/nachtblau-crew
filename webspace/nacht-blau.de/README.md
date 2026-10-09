# NachtBlau Projekt (nacht-blau.de)

Eigenständige Projekt-Webseite auf ALL-INKL. Projekte: **Hybrixon**, **Allxion** (`/allxion/`), Crew-Repo.

## URLs

- NachtBlau: https://nacht-blau.de/
- Hybrixon: https://hybrixon.com/
- Allxion: https://nacht-blau.de/allxion/

## Sync mit ALL-INKL

1. `.env.webspace.example` → `.env.webspace` (FTP-Zugang)
2. Optional Allxion bauen: `pnpm webspace:build-allxion`
3. Upload: `pnpm webspace:sync:nacht-blau`
4. Upload Hybrixon: `pnpm webspace:sync:one -- hybrixon.com` bzw. `FTP_REMOTE_DIR=/hybrixon.com pnpm webspace:sync:one`

`index.htm` wird beim Sync automatisch aus `index.html` gespiegelt (ALL-INKL DirectoryIndex).
