# Silk Dokumentation

## Produktübersicht (PDF)

**Datei:** [`Silk-Zusammenfassung.pdf`](Silk-Zusammenfassung.pdf)

8-seitige Übersicht – im **PDF-Viewer** öffnen (nicht als Textdatei im Editor).

Alternativ im Repo-Root: [`../silk-zusammenfassung.pdf`](../silk-zusammenfassung.pdf)

## Weitere Dokumente

| Dokument | Inhalt |
|----------|--------|
| [`CONNECT.md`](CONNECT.md) | Silk Connect – iPhone/iPad Begleitgeräte |
| [`PLATFORMS.md`](PLATFORMS.md) | Multi-Plattform-Strategie (PC, Tablet, Mac, Mobile) |
| [`../ROADMAP.md`](../ROADMAP.md) | Roadmap 1.0 → 2.0 |

Neu erzeugen:

```bash
pip install weasyprint
python3 scripts/generate-silk-summary-pdf.py
```

HTML-Vorlage: [`silk-produktuebersicht.html`](silk-produktuebersicht.html)
