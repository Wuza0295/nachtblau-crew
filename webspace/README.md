# Webspace-Spiegel (ALL-INKL)

Lokale Spiegel der Domains unter `webspace/<domain>/`.

| Domain | Pfad | Live |
|--------|------|------|
| NachtBlau GbR | `nacht-blau.de/` | https://nacht-blau.de/ |
| Hybrixon | `hybrixon.com/` | https://hybrixon.com/ |

## Voraussetzungen

```bash
cp .env.webspace.example .env.webspace
# FTP_USER / FTP_PASS aus ALL-INKL Members Area
```

## Befehle

```bash
pnpm webspace:pull                 # Remote → lokal
pnpm webspace:sync:nacht-blau      # GbR hochladen (index.htm wird gespiegelt)
pnpm webspace:sync:one hybrixon.com
pnpm webspace:build-allxion        # Crew-App nach /allxion/ stagen
```

Hybrixon-Logo (`assets/img/logo.svg`) und NachtBlau-Logo (`nacht-blau.de/assets/logo.svg`) nicht ersetzen.
