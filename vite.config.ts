import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: { host: "::", port: 8080 },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Reciply",
        short_name: "Reciply",
        description: "Рецепти, план харчування та список покупок",
        theme_color: "#0B1020",
        background_color: "#050816",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "images", expiration: { maxEntries: 100, maxAgeSeconds: 2592000 } },
          },
          {
            urlPattern: /^https:\/\/recipepwastorage\.blob\.core\.windows\.net\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "recipes-data", expiration: { maxEntries: 10, maxAgeSeconds: 3600 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: ["react", "react-dom"],
  },
}));
