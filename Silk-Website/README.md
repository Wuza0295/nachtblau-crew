# Silk-Website (lokal)

Statische Landing Page für Silk – ohne Build-Schritt.

## Online-Vorschau (sofort klickbar)

**https://raw.githack.com/Wuza0295/nachtblau-crew/cursor/silk-website-local-2818/Silk-Website/index.html**

Quickstart: [quickstart.html](https://raw.githack.com/Wuza0295/nachtblau-crew/cursor/silk-website-local-2818/Silk-Website/quickstart.html)

> Dauerhafte URL nach Merge + GitHub Pages: `https://wuza0295.github.io/nachtblau-crew/`  
> (GitHub Pages einmal unter Repo → Settings → Pages aktivieren)

## Lokal starten (auf deinem Mac/PC)

`127.0.0.1:8765` funktioniert **nur**, wenn der Server läuft:

```bash
git clone https://github.com/Wuza0295/nachtblau-crew.git
cd nachtblau-crew
git checkout cursor/silk-website-local-2818
cd Silk-Website
chmod +x start.sh
./start.sh
```

**Erst danach** im Browser: http://127.0.0.1:8765

Anderer Port: `./start.sh 8080`

## Dateien

| Datei | Inhalt |
|-------|--------|
| `index.html` | Landing Page |
| `style.css` | Design |
| `start.sh` | Lokaler Webserver |

## Hinweis

Vor öffentlichem Launch Impressum & Datenschutz in `index.html` ausfüllen.
Quell-Vorlage: `silk/docs/website/`
