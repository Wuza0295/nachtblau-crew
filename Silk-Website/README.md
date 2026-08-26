# Silk-Website (lokal)

Statische Landing Page für Silk – ohne Build-Schritt.

## Online-Vorschau (sofort klickbar)

**https://raw.githack.com/Wuza0295/nachtblau-crew/cursor/silk-website-local-2818/Silk-Website/index.html**

Quickstart: [quickstart.html](https://raw.githack.com/Wuza0295/nachtblau-crew/cursor/silk-website-local-2818/Silk-Website/quickstart.html)

> Dauerhafte URL nach Merge + GitHub Pages: `https://wuza0295.github.io/nachtblau-crew/`  
> (GitHub Pages einmal unter Repo → Settings → Pages aktivieren)

## Lokal starten

`127.0.0.1:8765` funktioniert **nur**, wenn der Server auf **demselben Rechner** läuft.

### Bazzite (empfohlen)

Im Terminal (Konsole):

```bash
# Einmalig: Repo holen
git clone https://github.com/Wuza0295/nachtblau-crew.git ~/nachtblau-crew
cd ~/nachtblau-crew
git checkout cursor/silk-website-local-2818

# Website starten (öffnet Browser automatisch)
cd Silk-Website
chmod +x start.sh
./start.sh
```

Browser manuell: **http://127.0.0.1:8765**

Ohne `git` (nur Download):

```bash
curl -L -o /tmp/silk-web.tar.gz \
  https://github.com/Wuza0295/nachtblau-crew/archive/refs/heads/cursor/silk-website-local-2818.tar.gz
tar -xzf /tmp/silk-web.tar.gz -C /tmp
cd /tmp/nachtblau-crew-cursor-silk-website-local-2818/Silk-Website
chmod +x start.sh
./start.sh
```

Anderer Port: `./start.sh 8080`

### Mac / Windows (WSL)

```bash
git clone https://github.com/Wuza0295/nachtblau-crew.git
cd nachtblau-crew
git checkout cursor/silk-website-local-2818
cd Silk-Website && ./start.sh
```

## Dateien

| Datei | Inhalt |
|-------|--------|
| `index.html` | Landing Page |
| `style.css` | Design |
| `start.sh` | Lokaler Webserver |

## Hinweis

Vor öffentlichem Launch Impressum & Datenschutz in `index.html` ausfüllen.
Quell-Vorlage: `silk/docs/website/`
