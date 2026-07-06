/// <reference types="vitest/config" />
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Los iconos se agregan en la fase de PWA (Fase 14) con el branding final
      manifest: {
        name: 'TATUDIN',
        short_name: 'Tatudin',
        description: 'Studio OS para estudios de tatuaje',
        theme_color: '#1a1625',
        background_color: '#f7f5fb',
        display: 'standalone',
        lang: 'es',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
