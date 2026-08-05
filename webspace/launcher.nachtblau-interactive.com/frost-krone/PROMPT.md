# Agent-Prompt: SNES-Zelda-Spiel mit Worldbuilding-Engine

> Referenz-Implementierung: `hyrule-quest/` und `frost-krone/`
> Engine-Kern: `world.js` + `maps.js` (ASCII-Raumformat)

---

## Prompt (copy-paste)

```
Erstelle ein neues Top-Down-Action-Adventure im Stil von „The Legend of Zelda: A Link to the Past“ (SNES) als Browser-Spiel in Vanilla JavaScript (ES Modules, Canvas 256×224, kein Framework).

WICHTIG: Verwende die gleiche Worldbuilding-Engine wie „Hyrule Quest“ / „Frost-Krone“. Die Engine-Architektur, das Datenformat und die World-API müssen identisch bleiben — nur Welt, Story, Items, Gegner-Skins und visuelles Thema sind neu.

---

## Setting-Vorlage: Eiswelt „Frost-Krone“

Thema: Gefrorenes Königreich, Kristalle statt Rubine, Frost-Krone als Sieg-Item.

- Overworld: Schnee, Eisseen, Tannenbäume, Frostheim (Dorf), Gletscher
- Dungeon: Eiskristall-Grotten, Eistüren, Frost-Titan als Boss
- Gegner: frostling, snowbat, guard, titan
- Währung: crystal_shard (statt rupee)
- Sieg-Item: frost_crown (statt triforce)
- Palette: Blau/Weiß/Eis-Töne (#d8e8f8, #68b8e8, #3888c8, #60e8ff)

---

## Architektur (nicht ändern)

Projektstruktur:
- index.html — Canvas + Overlay (Title / Game Over / Victory)
- js/main.js — Game Loop (requestAnimationFrame)
- js/game.js — Game State, Update/Render, Item-Logik
- js/world.js — World-Klasse (Raum-System, Transitions, Persistenz)
- js/maps.js — Weltdefinitionen als Daten (ASCII → Tile-Grid)
- js/entities.js — Player, Enemy, Kollisions-/Kampflogik
- js/sprites.js — Prozedurales Pixel-Art-Rendering
- js/input.js — Tastatur-Input
- js/constants.js — TILE=16, TILES-Enum, PALETTE, Timings
- css/style.css — CRT/Retro-Styling

---

## Worldbuilding-Engine (Kern — exakt so beibehalten)

### 1. Welt-Objekt-Format

```js
export const OVERWORLD = {
  theme: 'overworld',
  startRoom: '1,1',
  startPos: { x: 8, y: 10 },
  rooms: {
    'x,y': {
      name: 'Raumname',
      map: parseMap([...], theme),
      enemies: [{ type: 'frostling', x: 5, y: 5 }],
      items: [{ type: 'crystal_shard', x: 8, y: 3, value: 5 }],
      chest: { x: 5, y: 7, item: 'heart_container', opened: false },
      door: { x: 7, y: 3, keyRequired: true },
      sign: 'Lore-Text',
      stairs: { x: 7, y: 7, target: 'dungeon', room: '0,0', entry: { x: 8, y: 10 } },
    },
  },
};
```

### 2. ASCII-Tile-Map (16×14 Tiles pro Raum)

| Zeichen | Bedeutung         | Tile-ID |
|---------|-------------------|---------|
| W       | Wand              | 1       |
| .       | Gras/Schnee/Boden | 0 / 8   |
| B       | Busch (zerstörbar)| 3       |
| ~       | Wasser/Eis        | 2       |
| R       | Fels              | 4       |
| T       | Baum              | 13      |
| P       | Topf (zerstörbar) | 10      |
| C       | Truhe             | 9       |
| S       | Treppe            | 7       |
| D       | Verschlossene Tür | 5       |
| O       | Offene Tür        | 6       |
| F       | Dungeon-Boden     | 8       |
| =       | Brücke            | 11      |
| A       | Sand/Schneefeld   | 12      |
| #       | Zaun              | 14      |
| ?       | Schild            | 15      |

### 3. World-Klasse — API (unverändert)

- loadWorld / loadRoom / getSavedMap
- tryTransition / updateTransition (Screen-Scroll)
- useStairs / updateStairsTransition (Fade zwischen Welten)
- openChest / tryOpenDoor / checkSign / collectItems / destroyTile
- Persistenz unter `${worldName}:${roomX},${roomY}`

### 4. Gameplay-Loop

- Pfeiltasten: Bewegen
- Leertaste: Schwert
- Z: Schlüssel/Tür
- E/Enter: Truhe, Schild
- ↓ auf Treppe: Weltwechsel

Chest-Items: heart_container, sword_upgrade, key, [sieg-item]
Drop-Items: heart, crystal_shard, key

---

## Lieferumfang

1. Vollständiger spielbarer Code
2. 9 Overworld-Räume + 4 Dungeon-Räume
3. Spielbarer Loop: Start → Erkundung → Dungeon → Boss → Sieg
4. README mit Steuerung und Weltkarte
5. Launcher-Eintrag in games.json

---

## Qualitätskriterien

- SNES-Zelda-Feeling: Top-Down, Schwert, Räume, Truhen, Dungeon-Gating
- Kohärente Welt ohne tote Enden
- maps.js = einziger Level-Editor
- Eigenes IP (keine Hyrule-Namen)
```

---

## Variationen (Setting austauschen)

Ersetze nur den Setting-Block und `maps.js` / `PALETTE` / `sprites.js`:

| Setting      | Overworld-Biome        | Boss        | Sieg-Item    | Akzentfarbe |
|--------------|------------------------|-------------|--------------|-------------|
| Eiswelt      | Schnee, See, Gletscher | Frost-Titan | Frost-Krone  | #60e8ff     |
| Wüste        | Sand, Oase, Ruinen     | Sandwurm    | Sonnenjuwel  | #ffd700     |
| Vulkan       | Lava, Asche, Höhle     | Feuerdrache | Flammenzepter| #e85d2a     |
| Sci-Fi       | Station, Korridore     | Sentinel    | Kernmatrix   | #3ecfb2     |

Die Engine bleibt in allen Fällen identisch.
