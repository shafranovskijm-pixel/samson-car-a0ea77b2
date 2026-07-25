// Пост-обработка сборки Electron: переписываем абсолютные пути ассетов на
// относительные и переименовываем _shell.html в index.html, чтобы приложение
// корректно грузилось под file://.
const fs = require("fs");
const path = require("path");

const clientDir = path.join(__dirname, "..", "dist-electron-web", "client");
const shellPath = path.join(clientDir, "_shell.html");
const indexPath = path.join(clientDir, "index.html");

if (!fs.existsSync(shellPath)) {
  console.error("[fix-electron-paths] _shell.html не найден:", shellPath);
  process.exit(1);
}

let html = fs.readFileSync(shellPath, "utf8");

// Порядок важен: сначала более длинные варианты.
html = html
  .replace(/"\/\.\/assets\//g, '"./assets/')
  .replace(/'\/\.\/assets\//g, "'./assets/")
  .replace(/"\/assets\//g, '"./assets/')
  .replace(/'\/assets\//g, "'./assets/")
  .replace(/"\/favicon/g, '"./favicon')
  .replace(/'\/favicon/g, "'./favicon")
  // На всякий случай в JSON-манифесте роутера тоже.
  .replace(/\\"\/\.\/assets\//g, '\\"./assets/')
  .replace(/\\"\/assets\//g, '\\"./assets/');

fs.writeFileSync(indexPath, html);
console.log("[fix-electron-paths] index.html записан (", indexPath, ")");

// Быстрая проверка — не осталось ли абсолютных путей к ассетам.
const bad = html.match(/["'](\/\.?\/?assets\/[^"']+)/g);
if (bad && bad.length) {
  console.error("[fix-electron-paths] Остались абсолютные пути:", bad.slice(0, 5));
  process.exit(1);
}
console.log("[fix-electron-paths] OK, все пути относительные.");
