# Silk auf Bazzite testen (ohne Aurora-ISO / ohne VirtualBox)

Silk ist **kein separates Aurora-ISO**. Silk ist ein Bootc-Image.  
Du bist schon auf Bazzite → du schaltest einfach auf Silk um.

## Download abbrechen

Falls noch das Aurora-ISO läuft:

```bash
# Strg+C im Terminal
# Teildownload löschen:
rm -f ~/Silk-VMs/aurora-stable-webui-x86_64.iso ~/Silk-VMs/aurora-stable-webui-x86_64.iso.partial
```

VirtualBox brauchst du dafür **nicht**.

## Silk jetzt testen

```bash
curl -fsSL https://raw.githubusercontent.com/Wuza0295/nachtblau-crew/cursor/silk-website-local-2818/Silk-Website/scripts/test-silk-on-bazzite.sh | bash
```

Oder manuell:

```bash
# AMD / Intel
sudo bootc switch --enforce-container-sigpolicy ghcr.io/wuza0295/silk:latest
sudo systemctl reboot
```

NVIDIA:

```bash
sudo bootc switch --enforce-container-sigpolicy ghcr.io/wuza0295/silk-nvidia-open:latest
sudo systemctl reboot
```

Nach dem Login: `silk-setup`

## Zurück zu Bazzite

```bash
sudo bootc switch --enforce-container-sigpolicy ghcr.io/ublue-os/bazzite:stable
sudo systemctl reboot
```

## Wenn der Switch fehlschlägt

Das Image muss auf GHCR liegen (`ghcr.io/wuza0295/silk:latest`).  
Aktuell schlägt der Image-Build in GitHub Actions oft fehl / das Paket ist nicht öffentlich – dann erst CI/Publish fixen, danach erneut switchen.

Prüfen:

```bash
skopeo inspect docker://ghcr.io/wuza0295/silk:latest
```
