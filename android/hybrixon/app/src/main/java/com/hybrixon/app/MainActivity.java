package com.hybrixon.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private ProgressBar progress;
    private SwipeRefreshLayout swipeRefresh;
    private LinearLayout offline;
    private ValueCallback<Uri[]> filePathCallback;
    private Uri cameraImageUri;

    private final ActivityResultLauncher<String> cameraPermissionLauncher =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), granted -> {
                // Permission result handled when file chooser opens next time.
            });

    private final ActivityResultLauncher<Intent> fileChooserLauncher =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
                Uri[] uris = null;
                if (result.getResultCode() == RESULT_OK) {
                    Intent data = result.getData();
                    // Prefer ClipData: many pickers set both getData() (first file)
                    // and ClipData (all files). Old code took only getData() → 1 file.
                    if (data != null && data.getClipData() != null && data.getClipData().getItemCount() > 0) {
                        int count = data.getClipData().getItemCount();
                        uris = new Uri[count];
                        for (int i = 0; i < count; i++) {
                            uris[i] = data.getClipData().getItemAt(i).getUri();
                            try {
                                getContentResolver().takePersistableUriPermission(
                                        uris[i],
                                        Intent.FLAG_GRANT_READ_URI_PERMISSION
                                );
                            } catch (SecurityException ignored) {
                                // Not all providers support persistable grants.
                            }
                        }
                    } else if (data != null && data.getData() != null) {
                        uris = new Uri[]{data.getData()};
                        try {
                            getContentResolver().takePersistableUriPermission(
                                    data.getData(),
                                    Intent.FLAG_GRANT_READ_URI_PERMISSION
                            );
                        } catch (SecurityException ignored) {
                        }
                    } else if (cameraImageUri != null) {
                        uris = new Uri[]{cameraImageUri};
                    } else {
                        // Fallback for OEM pickers
                        uris = WebChromeClient.FileChooserParams.parseResult(
                                result.getResultCode(), data);
                    }
                }
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(uris);
                    filePathCallback = null;
                }
                cameraImageUri = null;
            });

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        progress = findViewById(R.id.progress);
        swipeRefresh = findViewById(R.id.swipeRefresh);
        offline = findViewById(R.id.offline);
        Button retryBtn = findViewById(R.id.retryBtn);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setUserAgentString(settings.getUserAgentString() + " HybrixonApp/1.0.2");

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
                if (host.equals("hybrixon.com") || host.equals("www.hybrixon.com") || host.endsWith(".hybrixon.com")) {
                    return false;
                }
                // mailto / external links → system handler
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (ActivityNotFoundException ignored) {
                    Toast.makeText(MainActivity.this, "Link nicht öffenbar", Toast.LENGTH_SHORT).show();
                }
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
                swipeRefresh.setRefreshing(false);
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
            public void onPermissionRequest(PermissionRequest request) {
                // Camera / mic for facial age checks etc.
                request.grant(request.getResources());
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, false, false);
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
                        != PackageManager.PERMISSION_GRANTED) {
                    cameraPermissionLauncher.launch(Manifest.permission.CAMERA);
                }

                boolean allowMultiple = fileChooserParams.getMode()
                        == FileChooserParams.MODE_OPEN_MULTIPLE;
                // HTML inputs use multiple — always enable multi-select for media forms.
                allowMultiple = true;

                Intent contentIntent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                contentIntent.addCategory(Intent.CATEGORY_OPENABLE);
                java.util.ArrayList<String> mimeList = new java.util.ArrayList<>();
                String[] acceptTypes = fileChooserParams.getAcceptTypes();
                if (acceptTypes != null) {
                    for (String raw : acceptTypes) {
                        if (raw == null || raw.isEmpty()) continue;
                        for (String part : raw.split(",")) {
                            String mime = part.trim();
                            if (!mime.isEmpty()) mimeList.add(mime);
                        }
                    }
                }
                if (mimeList.isEmpty()) {
                    contentIntent.setType("*/*");
                } else if (mimeList.size() == 1) {
                    contentIntent.setType(mimeList.get(0));
                } else {
                    boolean allVideo = true;
                    boolean allImage = true;
                    for (String mime : mimeList) {
                        if (!mime.startsWith("video/")) allVideo = false;
                        if (!mime.startsWith("image/")) allImage = false;
                    }
                    if (allVideo) {
                        contentIntent.setType("video/*");
                    } else if (allImage) {
                        contentIntent.setType("image/*");
                    } else {
                        contentIntent.setType("*/*");
                    }
                    contentIntent.putExtra(
                            Intent.EXTRA_MIME_TYPES,
                            mimeList.toArray(new String[0])
                    );
                }
                contentIntent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, allowMultiple);
                contentIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                contentIntent.addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);

                // Fallback GET_CONTENT for pickers that ignore OPEN_DOCUMENT
                Intent getContent = fileChooserParams.createIntent();
                getContent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, allowMultiple);
                getContent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                Intent cameraIntent = new Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE);
                try {
                    File photo = createImageFile();
                    cameraImageUri = FileProvider.getUriForFile(
                            MainActivity.this,
                            getPackageName() + ".fileprovider",
                            photo
                    );
                    cameraIntent.putExtra(android.provider.MediaStore.EXTRA_OUTPUT, cameraImageUri);
                } catch (IOException e) {
                    cameraImageUri = null;
                }

                Intent chooser = Intent.createChooser(contentIntent, "Dateien wählen");
                java.util.ArrayList<Intent> initial = new java.util.ArrayList<>();
                initial.add(getContent);
                if (cameraImageUri != null) {
                    initial.add(cameraIntent);
                }
                chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, initial.toArray(new Intent[0]));
                try {
                    fileChooserLauncher.launch(chooser);
                } catch (ActivityNotFoundException e) {
                    MainActivity.this.filePathCallback = null;
                    Toast.makeText(MainActivity.this, "Kein Datei-Picker verfügbar", Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }
        });

        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            try {
                Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(i);
            } catch (ActivityNotFoundException e) {
                Toast.makeText(this, "Download nicht möglich", Toast.LENGTH_SHORT).show();
            }
        });

        swipeRefresh.setColorSchemeColors(0xFF2DD4BF, 0xFFF59E0B);
        swipeRefresh.setOnRefreshListener(() -> {
            if (isOnline()) {
                webView.reload();
            } else {
                swipeRefresh.setRefreshing(false);
                showOffline();
            }
        });

        retryBtn.setOnClickListener(v -> loadStartUrl());

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
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
        String start = BuildConfig.APP_URL;
        if (intent != null && Intent.ACTION_VIEW.equals(intent.getAction()) && intent.getData() != null) {
            Uri data = intent.getData();
            String scheme = data.getScheme() == null ? "" : data.getScheme().toLowerCase(Locale.ROOT);
            String host = data.getHost() == null ? "" : data.getHost().toLowerCase(Locale.ROOT);
            if ("hybrixon".equals(scheme) && "open".equals(host)) {
                // hybrixon://open?url=https%3A%2F%2Fhybrixon.com%2F...
                String target = data.getQueryParameter("url");
                if (target != null && !target.isEmpty()) {
                    Uri targetUri = Uri.parse(target);
                    String th = targetUri.getHost() == null ? "" : targetUri.getHost().toLowerCase(Locale.ROOT);
                    if (th.equals("hybrixon.com") || th.equals("www.hybrixon.com")) {
                        start = target;
                    }
                }
            } else if (host.equals("hybrixon.com") || host.equals("www.hybrixon.com")) {
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
        webView.loadUrl(BuildConfig.APP_URL);
    }

    private void showOffline() {
        offline.setVisibility(View.VISIBLE);
        progress.setVisibility(View.GONE);
        swipeRefresh.setRefreshing(false);
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

    private File createImageFile() throws IOException {
        String time = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
        File dir = new File(getCacheDir(), "camera");
        if (!dir.exists() && !dir.mkdirs()) {
            throw new IOException("cache dir");
        }
        return File.createTempFile("HX_" + time + "_", ".jpg", dir);
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
        webView.destroy();
        super.onDestroy();
    }
}
