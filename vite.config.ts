// Настройки Vite — инструмента, который запускает проект при разработке и собирает его для публикации.

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Адрес, по которому живёт приложение. На GitHub Pages это https://tooezze.github.io/poker-app/,
  // поэтому все пути начинаются с /poker-app/ — и на компьютере тоже: http://localhost:5173/poker-app/
  base: '/poker-app/',
  plugins: [
    react(),
    tailwindcss(),
    // PWA: манифест (название, иконки, цвета) и service worker,
    // который сохраняет файлы приложения в телефоне, чтобы оно работало без интернета.
    VitePWA({
      registerType: 'autoUpdate', // новая версия подхватывается сама
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: 'Покер-трекер',
        short_name: 'Покер',
        description: 'Учёт домашней игры в покер: игроки, ребаи, банк',
        lang: 'ru',
        theme_color: '#022c22',
        background_color: '#022c22',
        display: 'standalone', // открывать без адресной строки, как обычное приложение
        orientation: 'portrait',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
