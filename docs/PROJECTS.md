# NachtBlau-Projektübersicht

Stand: 2026-08-23 · Branch `cursor/update-all-projects-ed91`

Diese Datei listet **alle** Projekte im NachtBlau-Ökosystem. Die kanonische Domain-Liste für die App liegt in `shared/site.ts` (`WEBSPACE_PROJECTS`); der Webspace-Spiegel nutzt `webspace/nacht-blau.de/data/projects.json`.

---

## 1. NachtBlau Crew (Haupt-App)

| | |
|---|---|
| **Repo** | `Wuza0295/nachtblau-crew` |
| **Stack** | React 19, Tailwind 4, Express 4, tRPC 11, Drizzle, Manus OAuth |
| **Features** | Forum, News, Free Games (GamerPower), Social Portal, Auth |
| **Dev** | `pnpm install && pnpm dev` |
| **Tests** | `pnpm test` (25 Specs), `pnpm check` (tsc) |

---

## 2. ALL-INKL Webspace (11 Live-Domains)

Host: `w02176b7.kasserver.com`

| ID | Domain | PR / Branch |
|----|--------|-------------|
| hybrixon | hybrixon.com | #9 `cursor/hybrixon-webspace-suche-84c9` |
| nachtblau-gbr | nacht-blau.de | #2 `cursor/webspace-sync-1690`, #6 `cursor/webspace-resync-3b23` |
| allxion | nacht-blau.de/allxion/ | (Teil der GbR-Seite) |
| nachtblau-crew | nachtblau-crew.de | — |
| nachtblau-interactive | nachtblau-interactive.com | — |
| nachtblau-hub | launcher.nachtblau-interactive.com | #3 Launcher, #7 Hub-Sync, #13 Android |
| autic-treasures | autic-treasures.com | #4 `cursor/autic-tresures-marketplace-e97d` |
| black-horizon | blackhorizon.info | — |
| noxcast | noxcast.com | — |
| ram-imbiss | ram-imbiss.at | — |
| iron-front | iron-front.nachtblau-interactive.com | #12 `cursor/iron-front-update-3-3e77` (v0.3.3) |

### Webspace-Sync

```bash
cp .env.webspace.example .env.webspace   # FTP_USER + FTP_PASS aus ALL-INKL Members Area
pnpm webspace:connect                    # FTPS-Test
pnpm webspace:pull                       # alle Domains → webspace/<domain>/
pnpm webspace:sync                       # lokal → Remote
pnpm hub:push                            # NachtBlau Hub → launcher-Subdomain
```

**Ohne `.env.webspace`:** Nur der lokale Spiegel `webspace/nacht-blau.de/` ist im Repo. Alle anderen Domains müssen per `pnpm webspace:pull` nach Credentials-Eintrag gezogen werden.

Weitere PRs: #8 ALL-INKL-Banner (`cursor/all-inkl-partner-banner-e2ae`), #10 Cursor-Addons, #11 Webspace-Backup.

---

## 3. NachtBlau Hub (Launcher)

| Plattform | Pfad | Live-URL |
|-----------|------|----------|
| Web | Webspace | https://launcher.nachtblau-interactive.com/ |
| Linux (Electron) | `apps/nachtblau-hub/linux` | `/linux.html` |
| Android (Capacitor) | `apps/nachtblau-hub/android` | `/android.html` |

```bash
cd apps/nachtblau-hub/android && pnpm install && pnpm update   # pull + cap sync
cd apps/nachtblau-hub/linux && pnpm install && pnpm start
pnpm hub:status    # Sync-Stand prüfen
pnpm hub:push      # nach Webspace deployen (.env.webspace nötig)
```

---

## 4. Hybrixon

- **URL:** https://hybrixon.com
- **Typ:** PHP-Social (Feed, Shorts, Stories, Gruppen, PWA, Android-APK 1.0.4)
- **Repo-Branch:** `cursor/hybrixon-webspace-suche-84c9` (PR #9)
- **Sync:** `pnpm webspace:pull hybrixon.com` (nach FTP-Setup)

---

## 5. Autic Treasures

- **URL:** https://autic-treasures.com (Spiegel: autictreasures.nacht-blau.de)
- **Typ:** Trading-Card-Community / Cardmarket-Features
- **Repo-Branch:** `cursor/autic-tresures-marketplace-e97d` (PR #4, Draft)

---

## 6. Iron Front

- **URL:** http://iron-front.nachtblau-interactive.com (HTTP – HTTPS-Zertifikat passt nicht zur Subdomain)
- **Version:** v0.3.3
- **Repo-Branch:** `cursor/iron-front-update-3-3e77` (PR #12, Draft)

---

## 7. Minecraft (beide Server + Geyser)

| Server | Pfad | Port | Protokoll |
|--------|------|------|-----------|
| Java Edition | `/opt/minecraft-java` | 25565 | TCP |
| Bedrock Edition | `/opt/minecraft-bedrock` | 19132 | UDP |
| Geyser (Crossplay) | Plugin/Standalone neben Java | 19134 | UDP |

**Hinweis:** Auf der Cloud-Agent-VM sind diese Pfade nicht vorhanden. Updates, Plugins und Configs müssen auf dem Produktions-Host (Bazzite/Server) geprüft werden:

```bash
# Auf dem Host mit installierten Servern:
ls -la /opt/minecraft-java /opt/minecraft-bedrock
# Java: server.jar + plugins/ (inkl. Geyser)
# Bedrock: bedrock_server + behavior_packs/
```

Konfiguration und Versionsstände gehören in ein separates `minecraft/`-Verzeichnis oder Server-Dokumentation auf dem Host – nicht in dieses App-Repo, solange kein Spiegel existiert.

---

## 8. Offene PR-Branches (alle mit update-branch synchronisiert)

| PR | Branch | Status |
|----|--------|--------|
| #2 | `cursor/webspace-sync-1690` | Draft |
| #3 | `cursor/launcher-neuaufbau-39ab` | Draft |
| #4 | `cursor/autic-tresures-marketplace-e97d` | Draft |
| #6 | `cursor/webspace-resync-3b23` | Draft |
| #7 | `cursor/linux-android-webspace-sync-56ee` | Open |
| #8 | `cursor/all-inkl-partner-banner-e2ae` | Open |
| #9 | `cursor/hybrixon-webspace-suche-84c9` | Open |
| #10 | `cursor/cursor-addons-projekte-7be2` | Draft |
| #11 | `cursor/webspace-backup-system-84c9` | Open |
| #12 | `cursor/iron-front-update-3-3e77` | Draft |
| #13 | `cursor/launcher-android-app-2a02` | Draft |
| #14 | `cursor/setup-dev-environment-2b45` | Draft |

Synchronisierung aller Branches:

```bash
./scripts/update-all-projects.sh
```

---

## 9. Vollständiges Update (Checkliste)

1. `git checkout cursor/update-all-projects-ed91 && git pull`
2. `pnpm install && pnpm update` (Root + Hub Android/Linux)
3. `pnpm test && pnpm check`
4. `.env.webspace` anlegen → `pnpm webspace:pull && pnpm hub:push`
5. `./scripts/update-all-projects.sh` (PR-Branches mergen)
6. Auf Host: Minecraft-Server + Geyser prüfen
7. PR gegen `main` mergen
