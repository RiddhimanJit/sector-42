import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      manifest: {
        name: 'Sector-42 TSOC',
        short_name: 'TSOC',
        description: 'Tactical Survival & Operations Command Terminal',
        theme_color: '#010a03',
        background_color: '#010a03',
        display: 'standalone'
      }
    })
  ],
  server: {
    port: 3000,
    host: true
  }
})
