# Silk in VirtualBox testen – **eigenständiges Silk**, kein Aurora

Silk ist das Produkt. Aurora ist nur die technische Basis (wie Fedora bei Bazzite) –
**du lädst kein Aurora** und installierst kein Aurora.

## Was du brauchst

1. **Silk-Installer-ISO** (oder QCOW2) aus dem Release  
2. VirtualBox mit funktionierendem `vboxdrv`

Download (sobald CI fertig):  
https://github.com/Wuza0295/nachtblau-crew/releases/tag/silk-media-latest

- `Silk-Installer-x86_64.iso` → Installation wie jedes OS  
- `Silk-VM-x86_64.qcow2` → fertige Disk (VirtualBox/Boxes)

## VirtualBox-Treiber (Bazzite)

```bash
lsmod | grep vboxdrv || sudo /sbin/vboxconfig
# falls tot:
sudo rpm-ostree install kernel-devel gcc make elfutils-libelf-devel
sudo systemctl reboot
sudo /sbin/vboxconfig
```

## Mit Silk-ISO

```bash
# ISO aus Release laden (Beispiel)
mkdir -p ~/Silk-VMs && cd ~/Silk-VMs
gh release download silk-media-latest -p 'Silk-Installer*.iso' -R Wuza0295/nachtblau-crew

# oder manuell von der Release-Seite speichern, dann:
./silk/scripts/test-silk-virtualbox.sh iso-local ~/Silk-VMs/Silk-Installer-x86_64.iso
./silk/scripts/test-silk-virtualbox.sh start
```

In der VM: **Silk installieren** (Anaconda) → reboot → `silk-setup`.

## Mit fertiger QCOW2 (schneller)

In VirtualBox: neue VM → vorhandene Disk `Silk-VM-x86_64.qcow2` (ggf. konvertieren)  
oder GNOME Boxes: QCOW2 direkt öffnen.

## CI

`.github/workflows/silk-disk.yml` baut ISO + QCOW aus `ghcr.io/wuza0295/silk:latest`  
und veröffentlicht sie unter Release-Tag `silk-media-latest`.
