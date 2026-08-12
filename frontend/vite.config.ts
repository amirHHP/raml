import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'رمل — ماجراجویی متنی',
        short_name: 'رمل',
        description: 'نقش‌آفرینی متنی مینیمال برای کویر',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'portrait',
        lang: 'fa',
        dir: 'rtl',
        start_url: '/',
        id: '/',
        scope: '/',
        categories: ['games', 'entertainment'],
        iarc_rating_id: '',
        prefer_related_applications: false,
        launch_handler: {
          client_mode: 'navigate-existing',
        },
        edge_side_panel: {
          preferred_width: 480,
        },
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'pwa-1024.png',
            sizes: '1024x1024',
            type: 'image/png',
          },
        ],
        screenshots: [
          {
            src: 'screenshot-narrow.png',
            sizes: '1024x1024',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'صفحه اصلی بازی رمل',
          },
          {
            src: 'screenshot-wide.png',
            sizes: '1024x1024',
            type: 'image/png',
            form_factor: 'wide',
            label: 'نمای دسکتاپ بازی رمل',
          },
        ],
        shortcuts: [
          {
            name: 'ادامه بازی',
            short_name: 'بازی',
            url: '/',
            icons: [{ src: 'pwa-192.png', sizes: '192x192' }],
          },
        ],
        share_target: {
          action: '/',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
          },
        },
        protocol_handlers: [
          {
            protocol: 'web+raml',
            url: '/?ref=%s',
          },
        ],
      } as any,
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
