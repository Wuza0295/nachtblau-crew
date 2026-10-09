# Silk-Website (lokal)

Statische Landing Page für Silk – ohne Build-Schritt.

## Online-Vorschau (sofort klickbar)

**https://raw.githack.com/Wuza0295/nachtblau-crew/main/Silk-Website/index.html**

Quickstart: [quickstart.html](https://raw.githack.com/Wuza0295/nachtblau-crew/main/Silk-Website/quickstart.html)

> Dauerhafte URL nach Merge + GitHub Pages: `https://wuza0295.github.io/nachtblau-crew/`  
> (GitHub Pages einmal unter Repo → Settings → Pages aktivieren)

## Lokal starten

`127.0.0.1:8765` funktioniert **nur**, wenn der Server auf **demselben Rechner** läuft.

### Bazzite (empfohlen)

Im Terminal (Konsole):

```bash
# Einmalig: Repo holen + Sync (Bazzite / Linux / WSL)
git clone https://github.com/Wuza0295/nachtblau-crew.git ~/nachtblau-crew
cd ~/nachtblau-crew
./scripts/sync-bazzite-windows.sh --website
```

Oder nur Website:

```bash
cd ~/nachtblau-crew/Silk-Website
chmod +x start.sh
./start.sh
```

Browser manuell: **http://127.0.0.1:8765**

Ohne `git` (nur Download):

```bash
curl -L -o /tmp/silk-web.tar.gz \
  https://github.com/Wuza0295/nachtblau-crew/archive/refs/heads/main.tar.gz
tar -xzf /tmp/silk-web.tar.gz -C /tmp
cd /tmp/nachtblau-crew-main/Silk-Website
chmod +x start.sh
./start.sh
```

Anderer Port: `./start.sh 8080`

### Windows (PowerShell)

```powershell
git clone https://github.com/Wuza0295/nachtblau-crew.git $env:USERPROFILE\nachtblau-crew
cd $env:USERPROFILE\nachtblau-crew
.\scripts\windows\Sync-NachtBlauRepo.ps1 -StartSilkWebsite
```

### Mac / Windows (WSL)

```bash
git clone https://github.com/Wuza0295/nachtblau-crew.git
cd nachtblau-crew
./scripts/sync-bazzite-windows.sh --website
```

## Dateien

| Datei | Inhalt |
|-------|--------|
| `assets/logo.svg` | Logo (dunkler Hintergrund) |
| `assets/logo-light.svg` | Logo (heller Hintergrund) |
| `assets/logo-icon.svg` | App-Icon / Favicon |
| `assets/logo-icon-512.png` | Icon 512×512 (PNG) |
| `silk-logo-pack.zip` | Alle Logos als ZIP |
| `logo.html` | Download-Seite |
| `index.html` | Landing Page |
| `style.css` | Design |
| `start.sh` | Lokaler Webserver |

## VirtualBox auf Bazzite (Silk testen)

Siehe [VIRTUALBOX-BAZZITE.md](VIRTUALBOX-BAZZITE.md) bzw.:

```bash
./scripts/install-virtualbox-bazzite.sh --install
# nach Reboot:
VBOX_ACCEPT_PUEL=1 ./scripts/install-virtualbox-bazzite.sh --extpack-only
```

## Hinweis

Vor öffentlichem Launch Impressum & Datenschutz in `index.html` ausfüllen.
Quell-Vorlage: `silk/docs/website/`
