# Frost-Krone

Top-Down-Action-Adventure im SNES-Zelda-Stil — gebaut mit der **Hyrule Quest Worldbuilding-Engine**.

## Spielen

Öffne `index.html` im Browser oder starte über den NachtBlau Launcher unter `frost-krone/`.

## Steuerung

| Taste | Aktion |
|-------|--------|
| ↑↓←→ / WASD | Bewegen |
| Leertaste | Schwert |
| Z | Eisschlüssel benutzen (Tür) |
| E / Enter | Truhe öffnen, Schild lesen |
| ↓ auf Treppe | Weltwechsel |

## Quest

1. Starte in der **Wächterhütte** — öffne die Truhe für ein Frostherz
2. Erkunde **Frostheim** und den **Kristallpfad** — finde die **Eisklinge**
3. Betrete den **Gletscher** über die **Gletscherspalte** oder **Eisruinen**
4. Besiege Gegner, finde den **Eisschlüssel** in der **Kristallschatz**
5. Öffne die Eistür, besiege den **Frost-Titan**, erobere die **Frost-Krone**

## Weltübersicht

### Overworld (3×3)

```
┌──────────┬──────────┬──────────────┐
│ Eiswald  │Schneefeld│Gefrorener See│
├──────────┼──────────┼──────────────┤
│ Frostheim│Wächter-  │Gletscher-    │
│          │hütte ★   │spalte → 🏔   │
├──────────┼──────────┼──────────────┤
│ Südhang  │Kristall- │ Eisruinen    │
│          │pfad ⚔   │ → 🏔 Boss    │
└──────────┴──────────┴──────────────┘
```

★ = Start · ⚔ = Eisklinge-Truhe · 🏔 = Dungeon-Eingang

### Dungeon (Gletscher)

```
┌──────────────┬──────────────┬──────────────┐
│ Gletscher-   │ Eiskorridor  │ Kristall-    │
│ eingang      │ 🔑 Tür       │ schatz 🔑    │
├──────────────┼──────────────┼──────────────┤
│              │ Thron des    │              │
│              │ Titanen 👑   │              │
└──────────────┴──────────────┴──────────────┘
```

## Engine

Identische Architektur wie Hyrule Quest:

- `maps.js` — ASCII-Level-Editor (einzige Datei für Leveldesign)
- `world.js` — Raum-Persistenz, Transitions, Interaktionen
- `game.js` — Gameplay-Loop

Siehe `PROMPT.md` für den vollständigen Agent-Prompt.
