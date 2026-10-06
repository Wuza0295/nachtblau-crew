# Silk als VM unter Bazzite / Linux

Ziel: **ein Befehl → Silk-Fenster**.

## Bazzite (empfohlen)

### 1. Virtualisierung einmalig

```bash
ujust setup-virtualization
```

Danach ab- und wieder anmelden (Gruppe `libvirt`). Prüfen:

```bash
ls -l /dev/kvm
groups | grep -E 'libvirt|kvm'
```

### 2. Silk-VM starten

**Fertige Disk** (schnellster Test):

```bash
curl -fsSL https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/scripts/go-bazzite-vm.sh | bash
```

Oder aus dem Repo:

```bash
bash silk/scripts/go-bazzite-vm.sh
```

**Installer-ISO** (wie echte Installation):

```bash
bash silk/scripts/go-bazzite-vm.sh iso
```

Das Skript:
- lädt `Silk-VM-*.qcow2` bzw. ISO vom Release `silk-media-latest` (~6 GB)
- prüft SHA256
- startet **QEMU/KVM mit GTK-Fenster** (Overlay = Original-Disk bleibt sauber)

Medien liegen in `~/Silk-VMs/`.

### Tipps

| Thema | Hinweis |
|-------|---------|
| Wenig RAM | `SILK_VM_MEM=3072 bash silk/scripts/go-bazzite-vm.sh` |
| Mehr Kerne | `SILK_VM_CPUS=6 bash …` |
| GNOME Boxes | `SILK_PREFER_BOXES=1 bash …` (öffnet die QCOW in Boxes) |
| VirtualBox | eher holprig auf Atomic → besser KVM; sonst `bash silk/scripts/go-virtualbox.sh` |

### Nach dem Login in der Silk-VM

```bash
silk-tour            # geführte Einrichtung
silk-tour --center
silk-ready status
```

---

## Andere Linux-Desktops

```bash
# wenn silk-vm im PATH (Silk-Image) oder:
bash silk/system_files/usr/bin/silk-vm qemu
```

`silk-vm` nutzt VNC; unter Bazzite ist **`go-bazzite-vm.sh`** mit GTK-Fenster angenehmer.

## Windows

Siehe [`VM-WINDOWS.md`](VM-WINDOWS.md) · `windows/Install-SilkVM.cmd`

## Medien

https://github.com/Wuza0295/nachtblau-crew/releases/tag/silk-media-latest
