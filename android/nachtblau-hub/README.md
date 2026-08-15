# NachtBlau Hub — Android-App 1.0.0

Native WebView-App für den **NachtBlau Launcher**. Inhalt kommt **immer live** vom Webspace:

https://launcher.nachtblau-interactive.com/android.html

Paket: `de.nachtblau.hub`  
App-Name: **NachtBlau Hub**  
Icon: bestehendes Launcher-Logo (`branding/logo.svg`)

Spiele, Bücher und der Lumina-Join-Hub bleiben auf dem ALL-INKL-Webspace. Studio-, PayPal-, Discord- und itch.io-Links öffnen im Systembrowser.

## Testen am Smartphone (Code Assist)

Kein PC und kein Android Studio nötig:

1. **Sofort:** [android.html](https://launcher.nachtblau-interactive.com/android.html) im Handy-Browser öffnen.
2. **Als App:** [NachtBlau-Hub.apk](https://github.com/Wuza0295/nachtblau-crew/releases/download/launcher-android-preview/NachtBlau-Hub.apk) antippen → unbekannte Apps erlauben → installieren.
3. **Ohne APK:** In Chrome „Zum Startbildschirm hinzufügen“.

Die Vorschau-APK kommt von GitHub Actions (`launcher-android-preview`). Alternative ohne GitHub-Login: [nightly.link ZIP](https://nightly.link/Wuza0295/nachtblau-crew/workflows/android-launcher.yml/cursor/launcher-android-app-2a02/nachtblau-hub-debug.zip).

Build am Handy neu anstoßen: GitHub → Actions → **Android Launcher** → Run workflow.

## Bauen (optional, Dev-PC)

```bash
export ANDROID_HOME=/pfad/zum/android-sdk
export JAVA_HOME=/pfad/zu/jdk17+
cd android/nachtblau-hub
./gradlew assembleDebug
```

Debug-APK: `app/build/outputs/apk/debug/app-debug.apk`

Release (optional, mit Keystore):

```
# android/nachtblau-hub/keystore.properties  (nicht committen)
storeFile=keystore/nachtblau-hub-release.jks
storePassword=…
keyAlias=nachtblau
keyPassword=…
```

```bash
./gradlew assembleRelease
```

## Deep Links

`https://launcher.nachtblau-interactive.com/…` öffnet die App, sofern sie installiert ist.
