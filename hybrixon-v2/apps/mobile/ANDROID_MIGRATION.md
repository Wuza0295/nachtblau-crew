# Android in-place upgrade checklist

This Expo app is an additive replacement candidate for the current Java
WebView app. It must upgrade the installed application; it must not create a
second Android identity.

## Compatibility values

- Application ID: `com.hybrixon.app`
- New version code: `6` (current WebView release is `5`)
- HTTPS links: `hybrixon.com/*` and `www.hybrixon.com/*`
- Custom link: `hybrixon://open?url=...`
- Required release certificate SHA-256:
  `4A:33:F7:FF:30:D3:FB:87:78:0F:CA:2A:54:6A:6C:0B:14:B1:7C:4C:38:E8:8A:CA:D4:90:01:64:19:C3:62:F6`

The certificate value must continue to match
`webspace/hybrixon.com/.well-known/assetlinks.json`.

## Configure EAS without replacing the key

1. Run `eas init` and put the resulting project ID into `app.json`.
2. Open Android credentials:

   ```bash
   eas credentials --platform android
   ```

3. Choose the existing keystore/manual upload option and provide the current
   Hybrixon release JKS, alias and passwords. Do **not** let EAS generate a new
   Android keystore.
4. Build an internal APK:

   ```bash
   eas build --platform android --profile preview
   ```

5. Verify the built APK certificate before installing or publishing:

   ```bash
   apksigner verify --print-certs hybrixon-v2.apk
   ```

   The SHA-256 certificate digest must equal the value above. Stop the rollout
   if it differs.

## Upgrade and deep-link test

Install WebView versionCode 5 first, then install the signed v2 APK over it
without uninstalling:

```bash
adb install -r hybrixon-v2.apk
adb shell am start -a android.intent.action.VIEW \
  -d "https://hybrixon.com/post.php?id=1"
adb shell am start -a android.intent.action.VIEW \
  -d "hybrixon://open?url=https%3A%2F%2Fhybrixon.com%2Fpost-create.php"
```

Verify:

- Android reports an upgrade rather than a signature conflict.
- HTTPS links open Hybrixon directly.
- `hybrixon://open` routes the encoded destination into Feed, Post or Profile.
- Upload retry, notifications, login refresh and app restart work on a
  physical Android 13+ device.

Keep `android/hybrixon` buildable. If v2 cannot pass parity checks, publish a
new WebView build with a version code higher than the stopped v2 rollout;
Android does not permit a normal downgrade.
