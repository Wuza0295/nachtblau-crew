# Silk als VM unter Bazzite / Linux

Ziel: **ein Befehl → Silk-Fenster**.

## Bazzite (empfohlen)

### 1. Virtualisierung einmalig

```bash
ujust setup-virtualization
```

**Wichtig:** Das installiert oft nur *virt-manager* + Kernel-Args – **nicht** immer `qemu-system-x86_64` auf dem Host.

QEMU zusätzlich layer'n und **rebooten**:

```bash
sudo rpm-ostree install qemu-system-x86 qemu-img qemu-kvm edk2-ovmf
sudo systemctl reboot
```

Danach neu anmelden. Prüfen:

```bash
curl -fsSL https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/scripts/go-bazzite-vm.sh | bash -s -- doctor
# erwartet: QEMU ✓ und KVM nutzbar ✓
```

### 2. Silk-VM starten

**Fertige Disk** (schnellster Test):

```bash
curl -fsSL https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/scripts/go-bazzite-vm.sh | bash
```

**Ohne Host-QEMU** – Disk laden und in virt-manager importieren:

```bash
curl -fsSL https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-connect-multiplatform-fef1/silk/scripts/go-bazzite-vm.sh | bash -s -- virt-manager
```

Dann in virt-manager: *Neue VM* → *Vorhandenes Disk-Image* → `~/Silk-VMs/Silk-VM-x86_64.qcow2`.

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
