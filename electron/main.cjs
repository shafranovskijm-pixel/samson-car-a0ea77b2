// Electron main process (CommonJS — package.json is "type": "module").
const { app, BrowserWindow, shell } = require("electron");
const fs = require("fs");
const http = require("http");
const path = require("path");

const CLIENT_DIR = path.join(__dirname, "..", "dist-electron-web", "client");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
};

function renderFatalPage(title, message) {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; font: 16px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #111827; color: #f9fafb; }
      main { width: min(680px, calc(100vw - 48px)); }
      h1 { margin: 0 0 12px; font-size: 26px; }
      p { margin: 0; color: #d1d5db; }
      code { display: block; margin-top: 18px; padding: 14px; border: 1px solid #374151; border-radius: 8px; overflow-wrap: anywhere; background: #030712; color: #fca5a5; }
    </style>
  </head>
  <body><main><h1>${title}</h1><p>${message}</p></main></body>
</html>`;
}

// Локальный http-сервер: file:// в Chromium блокирует ES-модули (CORS),
// поэтому статику отдаём через 127.0.0.1 с SPA-фолбэком на index.html.
function startLocalServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let urlPath;
      try {
        urlPath = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
      } catch {
        urlPath = "/";
      }

      let filePath = path.join(CLIENT_DIR, urlPath);
      if (!filePath.startsWith(CLIENT_DIR)) filePath = path.join(CLIENT_DIR, "index.html");
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(CLIENT_DIR, "index.html");
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        "content-type": MIME[ext] || "application/octet-stream",
        "cache-control": "no-cache",
      });
      fs.createReadStream(filePath).pipe(res);
    });

    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve(`http://127.0.0.1:${port}`);
    });
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    title: "Samson Auto CRM",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Внешние ссылки открывать в браузере.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error("[electron] did-fail-load", { errorCode, errorDescription, validatedURL });
  });

  win.webContents.on("render-process-gone", (_event, details) => {
    console.error("[electron] render-process-gone", details);
  });

  const indexPath = path.join(CLIENT_DIR, "index.html");
  if (!fs.existsSync(indexPath)) {
    const expected = path.relative(path.join(__dirname, ".."), indexPath);
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(renderFatalPage(
      "CRM не собрана внутри приложения",
      "В архиве нет web-файлов. Скачайте свежий архив или пересоберите приложение.",
    ).replace("</main>", `<code>${expected}</code></main>`))}`);
    return;
  }

  try {
    const origin = await startLocalServer();
    await win.loadURL(`${origin}/login`);
  } catch (error) {
    console.error("[electron] load failed", error);
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(renderFatalPage(
      "CRM не открылась",
      String((error && error.message) || error),
    ))}`);
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
