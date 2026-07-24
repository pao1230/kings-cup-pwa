import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  // Relative base so the app also works on GitHub Pages / sub-paths.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        // Cache-first for all static build assets → 100% offline (FR-5.2 / NFR-8).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
      manifest: {
        name: 'Kings Cup — เกมไพ่ปาร์ตี้',
        short_name: 'Kings Cup',
        description: 'เกมไพ่ Kings Cup แบบออฟไลน์ ปรับกติกาได้เอง',
        lang: 'th',
        theme_color: '#7c3aed',
        background_color: '#0f0a1e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
});
