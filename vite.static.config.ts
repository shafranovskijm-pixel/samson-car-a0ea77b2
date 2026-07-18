// Статическая SPA-сборка для деплоя на внешний хостинг (Timeweb, VDS, любой nginx).
// Отключает SSR (TanStack Start работает как SPA) и Nitro; на выходе — обычная
// статика в dist/ с index.html и ассетами. Не мешает основному vite.config.ts,
// который используется для сборки внутри Lovable.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Отключаем Nitro — не нужен сервер, только статика.
  nitro: false,
  // SPA-режим TanStack Start: рендер выполняется только в браузере.
  tanstackStart: {
    spa: { enabled: true },
  },
  vite: {
    build: {
      // Timeweb ждёт папку dist/
      outDir: "dist",
      emptyOutDir: true,
    },
  },
});
