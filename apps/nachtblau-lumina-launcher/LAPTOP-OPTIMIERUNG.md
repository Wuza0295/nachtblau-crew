# Minecraft auf dem Laptop optimieren (NachtBlau Lumina)

## Kurzantwort zu „warum so wenig?“ (Screenshot: RAM 29 GB)

Das ist **nicht wenig** — das ist praktisch das Maximum. Der Launcher (≤1.0.10) setzt:

`max = min(32, physischer_RAM_in_GiB − 2)`

Bei ~32 GB Laptop → Slider stoppt bei **~29–30 GB**. Vanilla/Java-Client braucht typisch **4–8 GB**.

## Sofort am Laptop (auch ohne neues Build)

1. **Lumina Launcher** öffnen → RAM-Slider auf **6–8 GB** (bei 16-GB-Gerät eher 4–6).
2. Nicht auf Maximum schieben — Windows, Browser, Discord brauchen Reserve.
3. **Java 21+** (Temurin) installiert lassen; im Launcher steht die Server-Version (z. B. 1.21.11).
4. In Minecraft (Video):
   - Renderdistanz **8–12** Chunks (Laptop)
   - VSync **an** oder FPS-Limit ~120
   - Grafik **Schnell** oder **Wunderschön** je nach GPU
   - Clouds/Partikel bei Bedarf reduzieren
5. Notebook am Netzteil spielen (Windows „Beste Leistung“), GPU-Treiber aktuell.
6. Optional: Sodium/Lithium/Iris nur wenn die Whitelist/Modpack-Regeln das erlauben — auf Vanilla-Servern oft nicht nötig.

## Was der Launcher ab 1.0.11 macht

- Empfohlenes Default: **6–8 GB** je nach System-RAM
- Slider-Max mit **≥25 % / ≥4 GB OS-Reserve**, Hard-Cap **16 GB**
- Alte 29‑GB-Settings werden einmalig auf den Empfehlungswert korrigiert
- JVM: G1GC + vorsichtige Client-Flags (`customArgs`)
- Einmalige `~/.nachtblau-minecraft/options.txt`-Defaults (nur wenn Datei fehlt)

## Server vs. Client

Der **Pi-Server** nutzt eigene Aikar-Flags unter `scripts/pi/` — das betrifft nicht den Client-Heap im Launcher. Client und Server getrennt optimieren.
