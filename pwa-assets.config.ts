// Настройки генератора иконок. Запуск: npm run icons
// Из public/icon.svg получаются PNG всех нужных размеров (в том числе для iPhone).

import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

const background = '#065f46' // цвет фона иконки — чтобы поля вокруг совпадали с ним

export default defineConfig({
  preset: {
    ...preset,
    maskable: { ...preset.maskable, padding: 0, resizeOptions: { background } },
    apple: { ...preset.apple, padding: 0, resizeOptions: { background } },
  },
  images: ['public/icon.svg'],
})
