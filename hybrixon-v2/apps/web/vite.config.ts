import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Hybrixon",
        short_name: "Hybrixon",
        description: "Closer. Freer.",
        theme_color: "#07110f",
        background_color: "#07110f",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/v2/posts"),
            handler: "NetworkFirst",
            options: {
              cacheName: "hybrixon-feed",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 20, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === "image" || request.destination === "video",
            handler: "CacheFirst",
            options: {
              cacheName: "hybrixon-media",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 7 * 24 * 60 * 60,
                purgeOnQuotaError: true,
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/v2": "http://localhost:8080",
    },
  },
});
