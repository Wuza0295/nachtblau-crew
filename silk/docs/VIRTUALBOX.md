# Silk in VirtualBox testen – **eigenständiges Silk**, kein Aurora

Silk ist das Produkt. Aurora ist nur die technische Basis (wie Fedora bei Bazzite) –
**du lädst kein Aurora** und installierst kein Aurora.

## Was du brauchst

1. **Silk-Installer-ISO** (oder QCOW2) aus dem Release  
2. VirtualBox mit funktionierendem `vboxdrv`

Download:  
https://github.com/Wuza0295/nachtblau-crew/releases/tag/silk-media-latest

GitHub erlaubt max. ~2 GiB pro Datei → ISO/QCOW sind **gesplittet** (`*.part00` …).

```bash
cd ~/Downloads
# alle Silk-Installer*.part* + sha256 + reassemble.sh vom Release laden, dann:
bash reassemble.sh
# → Silk-Installer-x86_64.iso
```

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

## VirtualBox – ein Befehl

```bash
curl -fsSL -O https://github.com/Wuza0295/nachtblau-crew/raw/cursor/aurora-silk-os-2818/silk/scripts/go-virtualbox.sh
bash go-virtualbox.sh
```

Lädt ISO, legt VM **Silk** an, startet VirtualBox. Kein Aurora.

## Mit Silk-ISO (manuell)

```bash
# ISO aus Release laden (Beispiel)
mkdir -p ~/Silk-VMs && cd ~/Silk-VMs
gh release download silk-media-latest -p 'Silk-Installer*' -p 'reassemble.sh' -R Wuza0295/nachtblau-crew
bash reassemble.sh   # falls nur *.part* da sind

# oder manuell von der Release-Seite speichern, dann:
./silk/scripts/test-silk-virtualbox.sh iso-local ~/Silk-VMs/Silk-Installer-x86_64.iso
./silk/scripts/test-silk-virtualbox.sh start
```

In der VM: **Silk installieren** (Anaconda) → reboot → `silk-setup`.

### Betriebssystem-Feld in VirtualBox (wichtig)

VirtualBox hat **kein** „Silk“ in der Dropdown-Liste – nur Hardware-Profile.
**Empfehlung:**

| Feld | Wert |
|------|------|
| **Name** | `Silk` |
| **Betriebssystem** | Linux 2.6 / 3.x / 4.x / 5.x **(64-bit)** |
| **Beschreibung** | Silk – eigenständiges Desktop-Betriebssystem |

**Nicht** Fedora wählen.

Alte VM `Silk-Test` wird automatisch korrigiert:

```bash
./silk/scripts/test-silk-virtualbox.sh fix
# → benennt zu Silk um, setzt Linux-Profil + Beschreibung
```

Das installierte System ist **Silk**.

## Mit fertiger QCOW2 (schneller)

In VirtualBox: neue VM → vorhandene Disk `Silk-VM-x86_64.qcow2` (ggf. konvertieren)  
oder GNOME Boxes: QCOW2 direkt öffnen.

## CI

`.github/workflows/silk-disk.yml` baut ISO + QCOW aus `ghcr.io/wuza0295/silk:latest`  
und veröffentlicht sie unter Release-Tag `silk-media-latest`.
