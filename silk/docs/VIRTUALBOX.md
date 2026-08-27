# Silk in VirtualBox testen

Silk hat **kein eigenes Installer-ISO**. In der VM:

1. Aurora installieren (Basis)  
2. `bootc switch` → **Silk**

`silk:latest` ist live: `ghcr.io/wuza0295/silk:latest`

## Auf Bazzite (Host)

### 0) VirtualBox-Treiber (wichtig)

Der Fehler `Kernel driver not installed (rc=-1908)` heißt: **vboxdrv fehlt**.

```bash
# prüfen
lsmod | grep vbox
sudo /sbin/vboxconfig

# falls immer noch tot (Atomic/Bazzite):
sudo rpm-ostree install kernel-devel gcc make elfutils-libelf-devel
sudo systemctl reboot
# nach Reboot:
sudo /sbin/vboxconfig
lsmod | grep vboxdrv
```

Secure Boot: Module ggf. signieren oder Secure Boot für Tests aus.

Wenn VirtualBox auf Bazzite dauerhaft scheitert → **GNOME Boxes / virt-manager** (KVM):

```bash
ujust setup-virtualization
```

### 1) One-Shot: ISO + VM

```bash
curl -fsSL -o /tmp/test-silk-vbox.sh \
  https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/aurora-silk-os-2818/silk/scripts/test-silk-virtualbox.sh
chmod +x /tmp/test-silk-vbox.sh
/tmp/test-silk-vbox.sh all
```

Oder aus dem Repo:

```bash
cd ~/nachtblau-crew && git fetch && git checkout cursor/aurora-silk-os-2818
./silk/scripts/test-silk-virtualbox.sh all
```

### 2) In der VM nach Aurora-Install

```bash
sudo bootc switch ghcr.io/wuza0295/silk:latest
sudo systemctl reboot
silk-setup
```

## VM-Empfehlung

| Einstellung | Wert |
|-------------|------|
| Firmware | **EFI** |
| RAM | ≥ 4 GB |
| CPU | ≥ 2 |
| Disk | ≥ 40 GB |
| ISO | Aurora stable webui |

## Nicht in VirtualBox

- **silk-asahi** (Apple Silicon) – nur echte M1+-Hardware + Asahi  
- **silk-nvidia-open** – in VBox sinnlos (keine NVIDIA-Passthrough-Garantie)
