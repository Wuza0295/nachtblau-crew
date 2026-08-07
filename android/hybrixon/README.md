# Hybrixon Android App

Native WebView shell for https://hybrixon.com/

## Build

```bash
export ANDROID_HOME=/path/to/android-sdk
export JAVA_HOME=/path/to/jdk17+
cd android/hybrixon
# create keystore.properties + keystore/ (see example below)
./gradlew assembleRelease
```

APK: `app/build/outputs/apk/release/app-release.apk`

Copy to website:

```bash
cp app/build/outputs/apk/release/app-release.apk ../../webspace/hybrixon.com/downloads/hybrixon.apk
cp app/build/outputs/apk/release/app-release.apk ../../webspace/hybrixon.com/downloads/hybrixon-1.0.0.apk
```

## keystore.properties (gitignored)

```
storeFile=keystore/hybrixon-release.jks
storePassword=…
keyAlias=hybrixon
keyPassword=…
```
