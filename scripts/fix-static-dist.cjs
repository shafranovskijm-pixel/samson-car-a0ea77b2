// Подготовка папки dist/ для обычного хостинга: Timeweb/Caddy/nginx/Apache.
// TanStack Start SPA-сборка может класть клиент в dist/client и называть вход
// _shell.html. Внешние хостинги ждут index.html прямо в корне сайта.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const client = path.join(dist, "client");

function fail(message) {
  console.error(`[fix-static-dist] ${message}`);
  process.exit(1);
}

function copyDirContents(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDirContents(src, dst);
    } else if (entry.isFile()) {
      fs.copyFileSync(src, dst);
    }
  }
}

if (!fs.existsSync(dist)) fail("папка dist не найдена после сборки");

if (fs.existsSync(client)) {
  copyDirContents(client, dist);
}

const shellPath = [
  path.join(dist, "_shell.html"),
  path.join(client, "_shell.html"),
].find((candidate) => fs.existsSync(candidate));
const indexPath = path.join(dist, "index.html");

if (!fs.existsSync(indexPath)) {
  if (!shellPath) fail("не найден index.html или _shell.html");
  fs.copyFileSync(shellPath, indexPath);
}

let html = fs.readFileSync(indexPath, "utf8");
html = html
  .replace(/"\/client\/assets\//g, '"/assets/')
  .replace(/'\/client\/assets\//g, "'/assets/")
  .replace(/"\.\/client\/assets\//g, '"./assets/')
  .replace(/'\.\/client\/assets\//g, "'./assets/");
fs.writeFileSync(indexPath, html);

for (const name of [".htaccess", "_redirects", "404.html", "favicon.ico"]) {
  const src = path.join(root, "public", name);
  const dst = path.join(dist, name);
  if (fs.existsSync(src)) fs.copyFileSync(src, dst);
}

if (!fs.existsSync(path.join(dist, "assets"))) {
  fail("папка dist/assets не найдена — ассеты сайта не попадут на хостинг");
}

if (!fs.existsSync(indexPath)) fail("dist/index.html не создан");
console.log("[fix-static-dist] OK: загружайте на хостинг именно содержимое папки dist/");