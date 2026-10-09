# Windows-Programme auf Silk

Ziel: **Doppelklick auf `.exe` / `.msi`** – möglichst ohne manuelle Wine-Konfiguration.

## Schnellstart

```bash
silk-install --setup-windows   # einmalig (auch Teil von silk-setup)
# danach:
# Doppelklick auf datei.exe
# oder:
silk-windows run ~/Downloads/Setup.exe
```

## Was passiert automatisch

1. **Bottles** wird installiert (falls fehlend)
2. Flasche **SilkWindows** wird angelegt (Gaming-Profil, DXVK/Fonts best-effort)
3. Das Programm startet
4. Optional: `silk-windows desktop programm.exe` → Startmenü-Eintrag

## Präferenzen

```bash
silk-windows prefer auto      # Standard: bekannte Linux-Apps anbieten, sonst Windows
silk-windows prefer windows   # immer Windows-Pfad, kein Flatpak-Dialog
silk-windows prefer linux     # zuerst Flatpak fragen
```

## Diagnose

```bash
silk-windows status
silk-windows doctor
```

## Was gut funktioniert

- Viele Installer und Portable-Tools
- Ältere Desktop-Software
- Spiele über Steam/Proton (besser: `silk-install --setup-gaming`)
- Office-Alternativen oft als Flatpak (LibreOffice) – wird bei Alias angeboten

## Was weiterhin scheitern kann

| Problem | Lösung |
|---------|--------|
| Anti-Cheat (Valorant, …) | `silk-windows vm-setup` – echte Windows-VM |
| Banking / Kernel-Treiber | Windows-VM + RDP |
| Sehr neue .NET / Store-Apps | oft nur in echter Windows-VM |

```bash
silk-windows vm-setup
```

## Befehle

| Befehl | Funktion |
|--------|----------|
| `silk-windows setup` | Umgebung einrichten |
| `silk-windows run datei.exe` | starten/installieren |
| `silk-windows prefer windows` | nie nach Flatpak fragen |
| `silk-windows desktop datei.exe` | Verknüpfung |
| `silk-windows vm-setup` | echte Windows-VM |

---

*Silk ist kein Windows – die Schicht macht Alltags-.exe nutzbar; Sonderfälle brauchen eine VM.*
