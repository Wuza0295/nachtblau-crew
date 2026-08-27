# Silk – Plattformen

## Schnellstart

| Gerät | Befehl | Image |
|-------|--------|-------|
| **PC / Laptop AMD/Intel** | `silk-setup` | `ghcr.io/wuza0295/silk:latest` |
| **PC NVIDIA** | `silk-setup` | `ghcr.io/wuza0295/silk-nvidia-open:latest` |
| **MacBook M1+** | `silk-asahi install` | `ghcr.io/wuza0295/silk-asahi:latest` |
| **Intel-MacBook** | `silk-asahi intel-mac` | kein natives Image |
| **Erkennung** | `silk-platform` / `silk-hardware status` | — |

## PC ✅

**Empfohlen:** Silk-Installer-ISO  
https://github.com/Wuza0295/nachtblau-crew/releases/tag/silk-media-latest  
(`*.part*` → `bash reassemble.sh` → VirtualBox EFI, OS-Profil = Linux, Name = Silk)

**Optional** (schon Bootc):

```bash
sudo bootc switch ghcr.io/wuza0295/silk:latest   # oder silk-nvidia-open
sudo systemctl reboot
silk-setup
```

## Apple Silicon (Asahi) ✅ experimentell

1. [Fedora Asahi Remix](https://fedora-asahi-remix.org/) in macOS  
2. Atomic/Kinoite  
3. `sudo bootc switch ghcr.io/wuza0295/silk-asahi:latest && reboot`  
4. `silk-asahi setup` · `silk-desktop mac`  
5. Nach Updates: `sudo bootc upgrade && sudo update-m1n1 && reboot`

## Intel-Mac ❌

Kein natives Silk. Alternativen: `silk-asahi intel-mac`.

## Tablet / Phone

Kein separates Phone-/Tablet-OS-Image. Touch-PCs nutzen das PC-Image.  
Smartphones bleiben Begleiter (KDE Connect o. Ä.).

Siehe auch: [PUBLISH.md](../PUBLISH.md)
