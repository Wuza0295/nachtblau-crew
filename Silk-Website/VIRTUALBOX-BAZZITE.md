# VirtualBox auf Bazzite (für Silk-Tests)

Bazzite ist immutable (`rpm-ostree`). VirtualBox lässt sich am zuverlässigsten **layern**.

## Schnellinstallation

Im Terminal auf **Bazzite**:

```bash
cd ~/nachtblau-crew
git fetch origin
git checkout cursor/silk-website-local-2818
chmod +x Silk-Website/scripts/install-virtualbox-bazzite.sh

# 1) VirtualBox layern (danach Reboot)
./Silk-Website/scripts/install-virtualbox-bazzite.sh --install

# nach dem Neustart:
# 2) Extension Pack (PUEL – persönliche Nutzung)
VBOX_ACCEPT_PUEL=1 ./Silk-Website/scripts/install-virtualbox-bazzite.sh --extpack-only
```

Ohne Clone – Skript direkt:

```bash
curl -fsSL -o /tmp/install-vbox.sh \
  https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-website-local-2818/Silk-Website/scripts/install-virtualbox-bazzite.sh
chmod +x /tmp/install-vbox.sh
/tmp/install-vbox.sh --install
```

## Was das Skript macht

1. Oracle-Repo: `virtualbox.repo`
2. `rpm-ostree install VirtualBox-7.2` (aktuell 7.2.x)
3. Nach Reboot: Extension Pack passend zur Version
4. User in Gruppe `vboxusers`

## Silk in der VM

1. [Aurora ISO](https://getaurora.dev/) in VirtualBox (EFI an, ≥4 GB RAM, ≥40 GB Disk)
2. Aurora installieren, dann:

```bash
sudo bootc switch --enforce-container-sigpolicy ghcr.io/wuza0295/silk:latest
sudo systemctl reboot
```

NVIDIA-Image nur auf echten NVIDIA-Hosts sinnvoll: `ghcr.io/wuza0295/silk-nvidia-open:latest`

## Falls Kernel-Module fehlschlagen

Auf manchen Atomic-Builds laden `vboxdrv`-Module nicht. Dann besser:

```bash
ujust setup-virtualization   # wenn vorhanden
# oder GNOME Boxes / virt-manager (QEMU/KVM)
```

## Lizenz

Das Extension Pack unterliegt der Oracle **PUEL** (Personal Use and Educational License) – kostenlos für private Nutzung, nicht für kommerzielle Weitergabe ohne Lizenz.
