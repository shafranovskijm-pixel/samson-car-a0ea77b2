// Сборка для Electron: SPA + относительные пути (base: './'), чтобы index.html
// корректно грузил ассеты по протоколу file://.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: false,
  tanstackStart: {
    spa: { enabled: true },
  },
  vite: {
    base: "./",
    build: {
      outDir: "dist-electron-web",
      emptyOutDir: true,
    },
  },
});
