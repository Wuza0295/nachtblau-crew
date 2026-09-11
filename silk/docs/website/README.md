# Silk Website (statische Vorlage)

Dateien:

- `index.html` – Landing Page
- `style.css` – Styles

## Lokal ansehen

```bash
cd silk/docs/website
python3 -m http.server 8080
# → http://localhost:8080
```

## Deploy (Beispiele)

- **GitHub Pages:** Ordner `docs/website` als Pages-Root oder als `gh-pages` Branch
- **All-Inkl / nginx:** Dateien nach `public_html/silk/` kopieren
- **Cloudflare Pages:** Build command leer, output = `silk/docs/website`

## Vor Launch

1. Impressum in `index.html` ausfüllen (#impressum)
2. Datenschutz anpassen (#datenschutz)
3. GitHub-Links auf `main` statt Feature-Branch setzen (nach Merge)
4. [`LEGAL.md`](../../LEGAL.md) lesen
