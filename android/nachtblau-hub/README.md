# Lumina — Android-App 1.0.0

Native Android-App für den Lumina-Launcher. Die App öffnet die veröffentlichte Lumina-Projektseite direkt in einer Vollbildansicht:

https://nachtblau-minecraft.bloodyangel0295.chatgpt.site/launcher

App-Name: **Lumina**  
Paketkennung: `de.nachtblau.lumina`  
Das bestehende NachtBlau-Eulenlogo wird als App-Symbol verwendet.

Die Seite zeigt die dokumentierten Java- und Bedrock/Geyser-Zugänge, Kopierfelder, Installationshilfe und den zuletzt bekannten Serverstatus. Links außerhalb der Lumina-Seite öffnen im Systembrowser.

## APK bauen

```bash
cd android/nachtblau-hub
./gradlew assembleDebug
```

Die Datei liegt anschließend unter `app/build/outputs/apk/debug/app-debug.apk`. GitHub Actions baut bei Änderungen an der Android-App eine installierbare Debug-APK als Artefakt.
