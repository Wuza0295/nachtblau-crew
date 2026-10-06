# Silk Dokumentation

## Produktübersicht (PDF)

**Datei:** [`Silk-Zusammenfassung.pdf`](Silk-Zusammenfassung.pdf)

8-seitige Übersicht – im **PDF-Viewer** öffnen (nicht als Textdatei im Editor).

Alternativ im Repo-Root: [`../silk-zusammenfassung.pdf`](../silk-zusammenfassung.pdf)

## Weitere Dokumente

| Dokument | Inhalt |
|----------|--------|
| [`OUT-OF-BOX.md`](OUT-OF-BOX.md) | Auspacken und loslegen – GPU + Controller on the fly |
| [`VM-BAZZITE.md`](VM-BAZZITE.md) | Silk-VM unter Bazzite (QEMU/KVM, ein Befehl) |
| [`VM-WINDOWS.md`](VM-WINDOWS.md) | Silk-VM unter Windows (Hyper-V / VirtualBox) |
| [`UX.md`](UX.md) | User Experience – Tour, Startzentrum, Menü |
| [`GPU-CONTROLLERS.md`](GPU-CONTROLLERS.md) | AMD / Intel / NVIDIA + Gamepads |
| [`CONNECT.md`](CONNECT.md) | Silk Connect – iPhone/iPad Begleitgeräte |
| [`PLATFORMS.md`](PLATFORMS.md) | Multi-Plattform-Strategie (PC, Tablet, Mac, Mobile) |
| [`../ROADMAP.md`](../ROADMAP.md) | Roadmap 1.0 → 2.0 |

Neu erzeugen:

```bash
pip install weasyprint
python3 scripts/generate-silk-summary-pdf.py
```

HTML-Vorlage: [`silk-produktuebersicht.html`](silk-produktuebersicht.html)
