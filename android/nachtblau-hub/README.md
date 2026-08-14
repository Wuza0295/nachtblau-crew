# NachtBlau Hub — Android-App 1.0.0

Native WebView-App für den **NachtBlau Launcher**. Inhalt kommt **immer live** vom Webspace:

https://launcher.nachtblau-interactive.com/android.html

Paket: `de.nachtblau.hub`  
App-Name: **NachtBlau Hub**  
Icon: bestehendes Launcher-Logo (`assets/logo.svg`)

Spiele, Bücher und der Lumina-Join-Hub bleiben auf dem ALL-INKL-Webspace. Studio-, PayPal-, Discord- und itch.io-Links öffnen im Systembrowser.

## Auf dem Handy

1. APK bauen (unten) und Sideloading erlauben.
2. App installieren — sie lädt denselben Stand wie der Browser auf `/android.html`.
3. Alternative ohne Build: [android.html](https://launcher.nachtblau-interactive.com/android.html) im Chrome öffnen → **Zum Startbildschirm hinzufügen**.

## Bauen (Android Studio / SDK)

```bash
export ANDROID_HOME=/pfad/zum/android-sdk
export JAVA_HOME=/pfad/zu/jdk17+
cd android/nachtblau-hub
./gradlew assembleDebug
```

Debug-APK:

`app/build/outputs/apk/debug/app-debug.apk`

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

CI: `.github/workflows/android-launcher.yml` baut die Debug-APK bei Änderungen unter `android/nachtblau-hub/`.

## Deep Links

`https://launcher.nachtblau-interactive.com/…` öffnet die App, sofern sie installiert ist.
