# Aether (Arbeitsname) — Social Spectrum Portal

> Finaler Produktname folgt. Dieses Dokument fasst Recherche und Produktkonzept zusammen.

## These

Es gibt kein Mainstream-Portal, das **gleichzeitig** Microblogging, visuelle Feeds, Kurzvideo-Discovery, Community-Spaces, Longform-Expertise und Sammlungen in **einer** Oberfläche führt — und dabei den Algorithmus **sichtbar und steuerbar** macht.

Bestehende „All-in-one“-Ansätze (z. B. Multi-Feed-Apps) bündeln Features, behalten aber oft Blackbox-Ranking. Research (Bonsai/CHI 2026, MIT Gobo) zeigt: Menschen wollen Intent und Kontrolle — scheitern aber an zu hohem Aufwand. Aether macht Intent **leicht** (4 Session-Modi) und Kontrolle **greifbar** (5 Gewichte).

## Was von wem

| Quelle | Stärke | Aether-Linse |
|--------|--------|--------------|
| X / Bluesky / Threads | Echtzeit, Threads, Custom Feeds | **Pulse** |
| Instagram | Visuelle Präsenz, Stories, Carousel | **Canvas** |
| TikTok / Reels | Discovery, vertikales Tempo | **Motion** |
| Discord / Reddit | Communities, Channels, Regeln | **Circles** |
| LinkedIn | Expertise, Longform, Professional Intent | **Signal** |
| Pinterest | Evergreen-Sammlungen | **Vault** |
| Gobo / Bonsai / Skyline | User-authored ranking | **Dein Algorithmus** |

## Unique Product Pillars

1. **Linsen statt App-Silos** — ein Composer, Inhalt erscheint in gewählten Linsen.
2. **Session-Intent** — Browse / Connect / Create / Focus formt Ranking und UI-Schwerpunkt.
3. **Transparente Gewichte** — Recency, Relevance, Diversity, Quiet, Social.
4. **Circles + Vault** — Qualität und Gedächtnis jenseits viraler Feeds.

## Demo

- In-Memory Social Store mit Seed-Profilen, Posts, Stories, Circles, Collections.
- Ohne OAuth: Demo-Viewer (`mira`) für Like/Follow/Compose.
- Mit OAuth: echte User-ID wird als Profil in den Store gespiegelt.

## Stack

React 19 · Tailwind 4 · tRPC 11 · Express · Framer Motion · Vitest
