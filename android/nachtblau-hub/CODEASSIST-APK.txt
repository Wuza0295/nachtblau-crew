# Code Assist — NachtBlau Hub APK erstellen

Kopiere **diese ganze Datei** in Code Assist auf dem Smartphone.

## Auftrag

Erstelle ein natives Android-Projekt und baue daraus die **installierbare APK**.

- App-Name: NachtBlau Hub
- applicationId: `de.nachtblau.hub`
- namespace: `de.nachtblau.hub`
- versionName: `1.0.0`
- versionCode: `1`
- minSdk: 24
- targetSdk / compileSdk: 34
- Start-URL (WebView, immer live): `https://launcher.nachtblau-interactive.com/android.html`
- User-Agent-Zusatz: `NachtBlauHub/1.0`
- Sprache der UI: Deutsch
- Logo **nicht neu zeichnen**. Icon aus dieser SVG erzeugen (Original-Launcher-Logo): `https://launcher.nachtblau-interactive.com/assets/logo.svg`

Die App ist eine WebView-Hülle. Inhalt kommt immer vom Webspace. Hosts in der WebView lassen:

- `launcher.nachtblau-interactive.com`
- `www.launcher.nachtblau-interactive.com`

Alle anderen Links (PayPal, itch.io, Discord, Studio, mailto) im Systembrowser öffnen. Hardware-Acceleration an, Bildschirm anlassen, Vollbild für HTML5-Spiele, Zurück = WebView-History, Offline-Hinweis mit „Erneut laden“.

Am Ende: `./gradlew assembleDebug` und die APK als `NachtBlau-Hub.apk` ausgeben.

---

## Dateien (exakt so anlegen)

### settings.gradle

```gradle
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "NachtBlauHub"
include(":app")
```

### build.gradle (Projektwurzel)

```gradle
plugins {
    id 'com.android.application' version '8.2.2' apply false
}
```

### gradle.properties

```properties
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
org.gradle.daemon=true
```

### gradle/wrapper/gradle-wrapper.properties

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.2.1-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

### app/build.gradle

```gradle
plugins {
    id 'com.android.application'
}

android {
    namespace 'de.nachtblau.hub'
    compileSdk 34

    defaultConfig {
        applicationId "de.nachtblau.hub"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
        resValue "string", "app_name", "NachtBlau Hub"
    }

    buildTypes {
        release {
            minifyEnabled false
        }
        debug {
            applicationIdSuffix ".debug"
            versionNameSuffix "-debug"
        }
    }

    buildFeatures {
        buildConfig true
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.activity:activity:1.8.2'
    implementation 'com.google.android.material:material:1.11.0'
}
```

### app/src/main/AndroidManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:hardwareAccelerated="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:networkSecurityConfig="@xml/network_security_config"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.NachtBlauHub"
        android:usesCleartextTraffic="false">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden|smallestScreenSize|uiMode"
            android:exported="true"
            android:launchMode="singleTask"
            android:screenOrientation="fullUser"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="launcher.nachtblau-interactive.com" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### app/src/main/res/values/strings.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">NachtBlau Hub</string>
    <string name="offline_title">Keine Verbindung</string>
    <string name="offline_body">Der NachtBlau Launcher braucht Internet, um Spiele, Bücher und den Join-Hub vom Webspace zu laden.</string>
    <string name="retry">Erneut laden</string>
    <string name="open_in_browser">Im Browser öffnen</string>
</resources>
```

### app/src/main/res/values/colors.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="nb_night">#030510</color>
    <color name="nb_primary">#3A8FD4</color>
    <color name="nb_accent">#A8E6FF</color>
    <color name="nb_text">#EEF6FF</color>
    <color name="nb_muted">#6B8AAB</color>
    <color name="ic_launcher_background">#040A14</color>
</resources>
```

### app/src/main/res/values/themes.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.NachtBlauHub" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">@color/nb_primary</item>
        <item name="colorPrimaryVariant">#0C1E38</item>
        <item name="colorSecondary">@color/nb_accent</item>
        <item name="android:statusBarColor">@color/nb_night</item>
        <item name="android:navigationBarColor">@color/nb_night</item>
        <item name="android:windowBackground">@color/nb_night</item>
        <item name="android:colorBackground">@color/nb_night</item>
        <item name="android:windowFullscreen">false</item>
    </style>
</resources>
```

### app/src/main/res/xml/network_security_config.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">nachtblau-interactive.com</domain>
        <domain includeSubdomains="true">nacht-blau.de</domain>
    </domain-config>
</network-security-config>
```

### app/src/main/res/layout/activity_main.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/nb_night"
    android:fitsSystemWindows="true">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:overScrollMode="never" />

    <ProgressBar
        android:id="@+id/progress"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="match_parent"
        android:layout_height="3dp"
        android:layout_gravity="top"
        android:indeterminate="false"
        android:max="100"
        android:progress="0"
        android:progressTint="@color/nb_accent"
        android:visibility="gone" />

    <LinearLayout
        android:id="@+id/offline"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="@color/nb_night"
        android:gravity="center"
        android:orientation="vertical"
        android:padding="28dp"
        android:visibility="gone">

        <ImageView
            android:layout_width="96dp"
            android:layout_height="96dp"
            android:contentDescription="@string/app_name"
            android:src="@mipmap/ic_launcher" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="18dp"
            android:text="@string/offline_title"
            android:textColor="@color/nb_text"
            android:textSize="22sp"
            android:textStyle="bold" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="10dp"
            android:gravity="center"
            android:text="@string/offline_body"
            android:textColor="@color/nb_muted"
            android:textSize="15sp" />

        <Button
            android:id="@+id/retryBtn"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="20dp"
            android:text="@string/retry" />

        <Button
            android:id="@+id/browserBtn"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="8dp"
            android:text="@string/open_in_browser"
            style="@style/Widget.MaterialComponents.Button.TextButton" />
    </LinearLayout>

    <FrameLayout
        android:id="@+id/fullscreenContainer"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="@android:color/black"
        android:visibility="gone" />
</FrameLayout>
```

### app/src/main/java/de/nachtblau/hub/MainActivity.java

```java
package de.nachtblau.hub;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends AppCompatActivity {
    private static final String APP_URL =
            "https://launcher.nachtblau-interactive.com/android.html";
    private static final Set<String> IN_APP_HOSTS = new HashSet<>(Arrays.asList(
            "launcher.nachtblau-interactive.com",
            "www.launcher.nachtblau-interactive.com"
    ));

    private WebView webView;
    private ProgressBar progress;
    private View offline;
    private FrameLayout fullscreenContainer;
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        progress = findViewById(R.id.progress);
        offline = findViewById(R.id.offline);
        fullscreenContainer = findViewById(R.id.fullscreenContainer);
        Button retryBtn = findViewById(R.id.retryBtn);
        Button browserBtn = findViewById(R.id.browserBtn);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUserAgentString(settings.getUserAgentString() + " NachtBlauHub/1.0");

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (isInApp(uri)) {
                    return false;
                }
                openExternal(uri);
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                progress.setVisibility(View.VISIBLE);
                offline.setVisibility(View.GONE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    showOffline();
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progress.setProgress(newProgress);
                progress.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
            }

            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (customView != null) {
                    callback.onCustomViewHidden();
                    return;
                }
                customView = view;
                customViewCallback = callback;
                fullscreenContainer.addView(view, new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                ));
                fullscreenContainer.setVisibility(View.VISIBLE);
                webView.setVisibility(View.GONE);
                hideSystemUi();
            }

            @Override
            public void onHideCustomView() {
                exitFullscreen();
            }
        });

        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) ->
                openExternal(Uri.parse(url)));

        retryBtn.setOnClickListener(v -> loadStartUrl());
        browserBtn.setOnClickListener(v -> openExternal(Uri.parse(APP_URL)));

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (customView != null) {
                    exitFullscreen();
                } else if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });

        handleLaunchIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleLaunchIntent(intent);
    }

    private void handleLaunchIntent(Intent intent) {
        String start = APP_URL;
        if (intent != null && Intent.ACTION_VIEW.equals(intent.getAction()) && intent.getData() != null) {
            Uri data = intent.getData();
            if (isInApp(data)) {
                start = data.toString();
            }
        }
        if (isOnline()) {
            offline.setVisibility(View.GONE);
            webView.loadUrl(start);
        } else {
            showOffline();
        }
    }

    private void loadStartUrl() {
        if (!isOnline()) {
            showOffline();
            return;
        }
        offline.setVisibility(View.GONE);
        webView.loadUrl(APP_URL);
    }

    private void showOffline() {
        offline.setVisibility(View.VISIBLE);
        progress.setVisibility(View.GONE);
    }

    private boolean isOnline() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        NetworkCapabilities caps = cm.getNetworkCapabilities(cm.getActiveNetwork());
        return caps != null && (
                caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
                        || caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)
                        || caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
        );
    }

    private boolean isInApp(Uri uri) {
        if (uri == null) return false;
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (!scheme.equals("https") && !scheme.equals("http")) return false;
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
        return IN_APP_HOSTS.contains(host);
    }

    private void openExternal(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException ignored) {
            Toast.makeText(this, "Link nicht öffenbar", Toast.LENGTH_SHORT).show();
        }
    }

    private void exitFullscreen() {
        if (customView == null) return;
        fullscreenContainer.removeView(customView);
        fullscreenContainer.setVisibility(View.GONE);
        webView.setVisibility(View.VISIBLE);
        customView = null;
        if (customViewCallback != null) {
            customViewCallback.onCustomViewHidden();
            customViewCallback = null;
        }
        showSystemUi();
    }

    private void hideSystemUi() {
        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.hide(WindowInsetsCompat.Type.systemBars());
        controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }

    private void showSystemUi() {
        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.show(WindowInsetsCompat.Type.systemBars());
    }

    @Override
    protected void onPause() {
        webView.onPause();
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
```

### branding/logo.svg (Original — nicht ersetzen)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none" role="img" aria-label="NachtBlau Interactive">
  <defs>
    <linearGradient id="nbBg" x1="16" y1="8" x2="112" y2="120">
      <stop offset="0%" stop-color="#1a3a6a"/>
      <stop offset="50%" stop-color="#0c1e38"/>
      <stop offset="100%" stop-color="#040a14"/>
    </linearGradient>
    <linearGradient id="nbAccent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a8e6ff"/>
      <stop offset="100%" stop-color="#3a8fd4"/>
    </linearGradient>
    <radialGradient id="nbGlow" cx="50%" cy="35%" r="55%">
      <stop offset="0%" stop-color="#5eeaff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#5eeaff" stop-opacity="0"/>
    </radialGradient>
    <filter id="nbSoft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <circle cx="64" cy="64" r="58" fill="url(#nbBg)" stroke="url(#nbAccent)" stroke-width="2"/>
  <circle cx="64" cy="64" r="58" fill="url(#nbGlow)"/>
  <circle cx="88" cy="36" r="14" fill="#eef6ff" opacity="0.95"/>
  <circle cx="92" cy="32" r="10" fill="#0c1e38"/>
  <path d="M28 28 L29.5 32 L34 32 L30.5 34.5 L32 39 L28 36.5 L24 39 L25.5 34.5 L22 32 L26.5 32 Z" fill="#d4f0ff" opacity="0.9"/>
  <path d="M100 52 L101 54.5 L103.5 54.5 L101.5 56 L102.5 58.5 L100 57 L97.5 58.5 L98.5 56 L96.5 54.5 L99 54.5 Z" fill="#a8e6ff" opacity="0.7"/>
  <text x="64" y="78" text-anchor="middle" font-family="Orbitron, system-ui, sans-serif" font-size="36" font-weight="800" fill="url(#nbAccent)" filter="url(#nbSoft)" letter-spacing="-2">NB</text>
  <text x="64" y="98" text-anchor="middle" font-family="Exo 2, system-ui, sans-serif" font-size="9" font-weight="500" fill="#6b8aab" letter-spacing="2.5">INTERACTIVE</text>
</svg>
```

Aus dieser SVG die Launcher-Icons erzeugen (`mipmap-mdpi` 48px bis `mipmap-xxxhdpi` 192px, round + adaptive, Hintergrund `#040A14`). Logo nicht umgestalten.

---

## Build

```bash
./gradlew assembleDebug
```

APK danach hier erwarten:

`app/build/outputs/apk/debug/app-debug.apk`

Datei umbenennen nach `NachtBlau-Hub.apk` und zum Installieren auf dem Smartphone bereitstellen.
