# Sync zwischen Bazzite und Windows

Hält den NachtBlau-Crew-Projektstand auf dem Bazzite-System und auf Windows identisch
und macht überprüfbar, ob beide Seiten wirklich gleich sind.

| Seite                    | Skript                            |
| ------------------------ | --------------------------------- |
| Bazzite / Linux          | `scripts/sync/nachtblau-sync.sh`  |
| Windows                  | `scripts/sync/nachtblau-sync.ps1` |
| Gemeinsame Konfiguration | `scripts/sync/sync-manifest.json` |

Beide Skripte lesen dasselbe Manifest und berechnen denselben Fingerabdruck. Stimmen die
Fingerabdrücke überein, ist der Stand auf beiden Rechnern bis auf das letzte Byte gleich.

## Ablauf

```bash
# 1. auf Bazzite
./scripts/sync/nachtblau-sync.sh

# 2. auf Windows (PowerShell)
.\scripts\sync\nachtblau-sync.ps1

# 3. auf einer der beiden Seiten
./scripts/sync/nachtblau-sync.sh compare
```

`sync` holt `origin/main`, setzt die Git-Konfiguration aus dem Manifest, prüft die
Toolchain, installiert die Abhängigkeiten und legt eine Zustandsdatei im Share-Ordner ab.
`compare` stellt die Zustandsdateien beider Seiten gegenüber.

## Share-Ordner

Die Zustandsdateien heißen `state-<plattform>-<rechnername>.json` und liegen standardmäßig
unter `<arbeitskopie>/.nachtblau-sync` (per `.gitignore` ausgenommen). Damit `compare` beide
Seiten sieht, muss der Ordner geteilt werden:

```bash
# Dual-Boot: gemeinsame Datenpartition
export NACHTBLAU_SYNC_SHARE=/run/media/$USER/Daten/nachtblau-sync   # Bazzite
```

```powershell
# Windows, dieselbe Partition
$env:NACHTBLAU_SYNC_SHARE = 'D:\nachtblau-sync'
```

Genauso funktionieren ein Cloud-Ordner, eine Netzwerkfreigabe oder ein USB-Stick.

## Optionen

| Bazzite           | Windows          | Bedeutung                           |
| ----------------- | ---------------- | ----------------------------------- |
| `--branch <name>` | `-Branch <name>` | Zweig statt `main`                  |
| `--root <pfad>`   | `-Root <pfad>`   | andere Arbeitskopie                 |
| `--share <pfad>`  | `-Share <pfad>`  | anderer Share-Ordner                |
| `--no-install`    | `-NoInstall`     | `pnpm install` überspringen         |
| `--verify`        | `-Verify`        | danach `pnpm check` und `pnpm test` |
| `--dry-run`       | `-DryRun`        | Probelauf ohne Änderungen           |
| `--json`          | `-AsJson`        | nur die Zustandsdatei ausgeben      |

Ohne `--root` wird die Arbeitskopie benutzt, in der das Skript liegt. Außerhalb eines
Checkouts klont es nach `~/NachtBlau/nachtblau-crew` bzw. `%USERPROFILE%\NachtBlau\nachtblau-crew`.

## Warum Zeilenenden hier wichtig sind

Ohne Gegenmaßnahme checkt Git unter Windows Textdateien mit CRLF aus. Die Arbeitskopien
wären dann byte-verschieden und jeder Dateivergleich zwischen Bazzite und Windows wäre
wertlos. Deshalb setzt das Manifest `core.autocrlf=false` und `core.eol=lf` auf beiden
Seiten, und `.gitattributes` schreibt `eol=lf` für alle Textdateien fest. `core.longpaths=true`
verhindert zusätzlich abgeschnittene Pfade in `node_modules` unter Windows.

## Bazzite-Besonderheiten

Bazzite ist ein Fedora-Atomic-/bootc-System: das Host-Dateisystem ist unveränderlich.
Fehlt Node oder pnpm, installiert das Skript deshalb nichts per `dnf` oder `rpm-ostree`
(das würde einen Neustart erzwingen), sondern weist auf den passenden Weg hin:

```bash
brew install node          # Homebrew ist auf Bazzite vorinstalliert
corepack enable            # pnpm bereitstellen
distrobox enter            # Alternative: Container mit beschreibbarem System
```

## Windows-Besonderheiten

Fehlende Werkzeuge kommen über winget:

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
corepack enable
```

Läuft das Skript nicht, weil die Ausführungsrichtlinie es blockiert:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync\nachtblau-sync.ps1
```

## Tests

```bash
./scripts/sync/tests/run-sync-tests.sh
```

Die Tests prüfen die Syntax beider Skripte, fahren einen vollständigen Sync gegen ein
lokales Test-Remote über den Linux- und den Windows-Codepfad und stellen sicher, dass beide
denselben Fingerabdruck erzeugen, dass `compare` Gleichstand und Abweichung korrekt meldet
und dass der Probelauf nichts verändert. `shellcheck` und `pwsh` werden genutzt, wenn
vorhanden, sonst übersprungen.
