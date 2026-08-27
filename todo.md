# NachtBlau Crew – Project TODO

## Branding & Design
- [x] Eulen-Mond-Logo generieren und als statisches Asset hochladen
- [x] Dunkles Blau-Design-System in index.css (Farben, Schriften, Tokens)
- [x] Google Fonts (Orbitron + Sora) in index.html einbinden
- [x] Globale Navigation mit Logo, Links und Auth-Status

## Community Launcher (Startseite)
- [x] Launcher von Grund auf neu: Full-Bleed Hero mit Brand-Signal
- [x] Launch-Module für Free Games, News, Forum
- [x] Spotlight Giveaway + News Feed + Forum Pulse
- [x] Netzwerk-Dock (Webspace / GitHub) beibehalten
- [x] Framer-Motion Einstiege + Sternenfeld

## Free Games & Angebote
- [x] Backend: tRPC-Router für Free Games (Epic Games / GamerPower API)
- [x] Frontend: Free Games Seite mit Karten-Layout
- [x] Angebote mit Ablaufdatum und externem Link

## News-Bereich
- [x] Backend: tRPC-Router für Gaming-News (RSS Feeds)
- [x] Kategorien: PC, Konsolen, Gaming, Steam/Valve
- [x] Frontend: News-Seite mit Artikel-Karten (Titel, Bild, Datum, Quelle)
- [x] Kategorie-Filter

## Community-Forum
- [x] Datenbankschema: forum_categories, forum_threads, forum_posts
- [x] Backend: tRPC-Router für Forum (CRUD Threads, Posts)
- [x] Frontend: Forum-Übersicht mit Kategorien
- [x] Frontend: Thread-Liste pro Kategorie
- [x] Frontend: Thread-Detail mit Kommentaren
- [x] Neuen Thread erstellen (authentifiziert)
- [x] Kommentar verfassen (authentifiziert)

## Authentifizierung & Nutzerprofil
- [x] OAuth-Login via Manus (bereits im Template)
- [x] Nutzerprofil-Seite mit Avatar, Name, Forum-Aktivitäten
- [x] Geschützte Routen für Forum-Aktionen

## Tests
- [x] Vitest: Forum-Router Tests
- [x] Vitest: Free Games Router Tests (via Forum-Tests abgedeckt)
