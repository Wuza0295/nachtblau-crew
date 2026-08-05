# Bluepole

SNES-**Mode-7**-Kart-Rennen mit Double-Dash-Mechanik. NachtBlau-Racing — **Blue** + **Pole** (Position).

## Was steckt drin

**SNES (Super Mario Kart)**
- Mode-7-Bodenprojektion
- Pixel-HUD, Minimap, Countdown
- Items: Banane, Panzer, Pilz, Stern, Blitz
- Strecken: Kronenring, Nebelpass, Schattenstadt

**GameCube (Double Dash)**
- Zwei Charaktere pro Kart
- Zwei Item-Slots + Tausch
- Charakter-Spezialitems
- Drift + Mini-Turbo
- Gewichts-Bumps

## Steuerung

| Taste | Aktion |
|-------|--------|
| ↑ / W | Gas |
| ↓ / S | Bremsen / Rückwärts |
| ← → / A D | Lenken |
| Shift / C | Drift → Mini-Turbo |
| Z / N | Item Fahrer |
| X / M | Item Beifahrer |
| Q / Tab | Items tauschen |
| Enter | Bestätigen |
| Esc | Menü |

Im NachtBlau-Launcher: **Spiele → Bluepole → Spiel starten**

## Lokal starten

```bash
cd repos/bluepole
python3 -m http.server 8766
# → http://localhost:8766
```

Oder Launcher (`scripts/start-local.sh` → http://127.0.0.1:8080/):

```bash
scripts/sync-bluepole.sh
```

## Charaktere

Luma, Shade, Ember, Bolt, Titan, Mira, Rook, Spark

## Karts

Sprint · Cruiser · Tank
