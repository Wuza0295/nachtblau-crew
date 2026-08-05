# NachtBlau Hub — Platform Sync

Alle Plattformen teilen denselben Katalog (`config/games.json`) und dieselben Spiele-Ordner.

| Plattform | Einstieg | Bridge | Styles |
|-----------|----------|--------|--------|
| Web | `index.html` | `site-bridge.js` | `styles-web.css` |
| Linux | `linux.html` | `linux-bridge.js` | `styles-linux.css` |
| Android | `android.html` | `android-bridge.js` | `styles-android.css` |

Live:
- Web: https://launcher.nachtblau-interactive.com/
- Linux: https://launcher.nachtblau-interactive.com/linux.html
- Android: https://launcher.nachtblau-interactive.com/android.html

```bash
pnpm webspace:sync:one launcher.nachtblau-interactive.com
python3 scripts/sync-launcher-platforms.py --push
```
