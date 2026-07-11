import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves from https://<user>.github.io/<repo>/ so the app must be
// built with a matching base path. The Actions workflow sets VITE_BASE to
// "/<repo>/" automatically; local dev/build falls back to "/".
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split the charting library so the initial shell stays light.
          recharts: ['recharts'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Retatrutide Companion',
        short_name: 'Reta Companion',
        description:
          'Private, offline-first companion for a doctor-supervised GLP-1 program.',
        theme_color: '#0e7c6b',
        background_color: '#0b1220',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The app is fully offline; the ONLY network call it ever makes is the
        // user-initiated Claude request. Never cache or intercept that host.
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [],
      },
    }),
  ],
})
