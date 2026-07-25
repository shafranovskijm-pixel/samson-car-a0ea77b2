// Проверяет готовый Electron app.asar перед публикацией ZIP.
// Цель — не дать выпустить архив, где есть exe, но нет web-сборки CRM.
const fs = require("fs");

const asarPath = process.argv[2];
if (!asarPath) {
  console.error("[verify-electron-package] Укажите путь к app.asar");
  process.exit(1);
}

if (!fs.existsSync(asarPath)) {
  console.error("[verify-electron-package] app.asar не найден:", asarPath);
  process.exit(1);
}

let asar;
try {
  asar = require("@electron/asar");
} catch (error) {
  console.error("[verify-electron-package] Не удалось загрузить @electron/asar", error);
  process.exit(1);
}

const entries = asar.listPackage(asarPath);
const has = (entry) => entries.includes(`/${entry}`);
const hasPrefix = (prefix) => entries.some((entry) => entry.startsWith(`/${prefix}`));

const required = [
  "package.json",
  "electron/main.cjs",
  "dist-electron-web/client/index.html",
];

const missing = required.filter((entry) => !has(entry));
if (missing.length) {
  console.error("[verify-electron-package] В app.asar нет обязательных файлов:");
  for (const entry of missing) console.error(`- ${entry}`);
  process.exit(1);
}

if (!hasPrefix("dist-electron-web/client/assets/")) {
  console.error("[verify-electron-package] В app.asar нет assets web-сборки");
  process.exit(1);
}

const hasJs = entries.some((entry) => entry.startsWith("/dist-electron-web/client/assets/") && entry.endsWith(".js"));
const hasCss = entries.some((entry) => entry.startsWith("/dist-electron-web/client/assets/") && entry.endsWith(".css"));
if (!hasJs || !hasCss) {
  console.error("[verify-electron-package] Assets неполные: JS или CSS не найдены");
  process.exit(1);
}

console.log("[verify-electron-package] OK: web-сборка внутри app.asar найдена.");