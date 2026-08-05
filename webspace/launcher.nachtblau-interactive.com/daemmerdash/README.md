# Dämmerdash

SNES-**Mode-7**-Kart-Rennen mit Mechaniken aus Mario Kart: Double Dash (GameCube).

## Was steckt drin

**Aus Super Mario Kart (SNES)**
- Mode-7-Bodenprojektion (Pseudo-3D)
- Pixel-HUD, Minimap, Countdown
- Klassische Items: Banane, Panzer, Pilz, Stern, Blitz
- Cup-Strecken (Kronenring, Nebelpass, Schattenstadt)

**Aus Double Dash (GameCube)**
- **Zwei Charaktere** pro Kart (Fahrer + Beifahrer)
- **Zwei Item-Slots** — je einer pro Charakter
- **Item-Tausch** zwischen den Slots
- **Charakter-Spezialitems** (Sternenschub, Schattenpanzer, Feuerspur, …)
- **Drift + Mini-Turbo** (zwei Ladestufen)
- Gewichts-Bump zwischen Karts

## Steuerung

| Taste | Aktion |
|-------|--------|
| ↑ / W | Gas |
| ↓ / S | Bremsen / Rückwärts |
| ← → / A D | Lenken |
| Shift / C | Drift (halten → Mini-Turbo beim Loslassen) |
| Z / N | Item Fahrer (Slot 1) |
| X / M | Item Beifahrer (Slot 2) |
| Q / Tab | Items tauschen |
| Enter | Bestätigen |
| Esc | Menü / Abbruch |

Im NachtBlau-Launcher: **Spiele → Dämmerdash → Spiel starten**

## Lokal starten

```bash
cd repos/daemmerdash
python3 -m http.server 8766
# → http://localhost:8766
```

Oder über den Launcher (`scripts/start-local.sh` → http://127.0.0.1:8080/), nach Sync:

```bash
scripts/sync-daemmerdash.sh
```

## Charaktere

Luma, Shade, Ember, Bolt, Titan, Mira, Rook, Spark — jeweils mit eigenem Spezial.

## Karts

Sprint · Cruiser · Tank — unterschiedliche Tempo-/Handling-Profile.
