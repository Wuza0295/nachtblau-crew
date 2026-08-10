package com.hybrixon.app;

import android.webkit.JavascriptInterface;

/**
 * JS bridge used by the Hybrixon website inside the WebView.
 */
public class HybrixonJsBridge {
    private final MainActivity activity;

    public HybrixonJsBridge(MainActivity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public void setUploading(boolean uploading) {
        activity.runOnUiThread(() -> activity.setUploading(uploading));
    }

    @JavascriptInterface
    public void requestNotifications() {
        activity.runOnUiThread(activity::requestNotificationPermission);
    }

    @JavascriptInterface
    public void showNotification(String title, String body, String url) {
        activity.showTrayNotification(
                title == null ? "Hybrixon" : title,
                body == null ? "" : body,
                url == null ? "https://hybrixon.com/notifications.php" : url
        );
    }
}
