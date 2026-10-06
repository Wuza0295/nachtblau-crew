# NachtBlau Hub — Windows

Electron-Shell wie unter Linux/Bazzite. Inhalt kommt live vom Webspace.

## Start

```powershell
cd apps\nachtblau-hub\windows
pnpm install
pnpm start
```

Öffnet `https://launcher.nachtblau-interactive.com/windows.html` (Fallback: `index.html` / Root-URL).

## Pi / Minecraft vom Windows-PC

SSH und Desktop-Install liegen unter `scripts/pi/`:

```powershell
cd ..\..\..\scripts\pi
.\run-lightweight-desktop-from-windows.ps1
```

Oder lokaler Cursor-Agent mit Prompt aus `scripts/pi/LOCAL-AGENT-PROMPT.md` (**Run on: This Computer**).
