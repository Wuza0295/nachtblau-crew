# NachtBlau Hub — immer Webspace

**Eine Quelle:** `https://launcher.nachtblau-interactive.com/`

| Gerät | URL |
|-------|-----|
| Browser | `/` bzw. `index.html` |
| Linux (Bazzite) | `/linux.html` |
| Android | `/android.html` |

```
Bazzite / Android / Browser  ──lesen──►  Webspace (ALL-INKL)
                 ▲
                 │  pnpm hub:push
            dein PC
```

## Android aktualisieren

```bash
cd apps/nachtblau-hub/android
pnpm install
pnpm update          # pull + prepare www + cap sync
pnpm open            # Android Studio → aufs Handy
```

Details: [android/README.md](./android/README.md)

## Linux (Bazzite)

```bash
cd apps/nachtblau-hub/linux && pnpm install && pnpm start
```

## Webspace deployen

```bash
pnpm webspace:connect
pnpm hub:push
```
