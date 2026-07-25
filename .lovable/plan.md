## Проблема
Кнопка «Скачать для Windows» на странице входа ссылается на asset `SamsonCRM-windows.zip` (asset_id `4966b9bd…`), но по этому URL сейчас отдаётся SPA-заглушка `index.html` (~4 КБ) вместо архива. Проверка: загруженный вами файл — это HTML, а не ZIP. Значит, оригинальный ассет в R2 недоступен/удалён.

## План исправления

1. **Пересобрать Windows-сборку Electron** заново из актуального кода:
   - `bun run build` (веб-часть под Electron: `vite.electron.config.ts` → `dist-electron-web/`)
   - `npx @electron/packager . "SamsonCRM" --platform=win32 --arch=x64 --out=electron-release --overwrite` с исключением `node_modules/src/public/electron-release`
   - Упаковать результат: `cd electron-release && zip -r /tmp/SamsonCRM-windows.zip SamsonCRM-win32-x64/`

2. **Залить архив как Lovable-ассет** через `lovable-assets create --file /tmp/SamsonCRM-windows.zip --filename SamsonCRM-windows.zip > src/assets/downloads/SamsonCRM-windows.zip.asset.json`. Это создаст новый постоянный URL в R2.

3. **Обновить ссылку в UI**:
   - В `src/routes/login.tsx` и `src/routes/settings.tsx` импортировать `SamsonCRM-windows.zip.asset.json` из `src/assets/downloads/` (сейчас `login.tsx` вообще не показывает кнопку — по прошлой правке её убрали; кнопка живёт в Настройках → Аккаунт; проверю оба места и подключу актуальный asset JSON).
   - Заменить старую загрузку через `<a href download>` на fetch+blob (по правилу превью — прямые `href` к статике требуют авторизации и падают).

4. **Проверить размер и content-type** нового asset JSON (`size` должен быть ~140–150 МБ, `content_type: application/zip`), убедиться, что скачивание работает и на preview, и на published.

## Технические детали
- Старый файл `src/assets/downloads/SamsonCRM-windows.zip.asset.json` перезапишется новым `asset_id`/`url`.
- Файл в `dist-electron-web/server/assets/login-FHINjCph.js` — это уже собранный артефакт, править не нужно, пересоберётся автоматически.
- Кнопка на login-странице сейчас в коде отсутствует (мы её убирали) — если хотите вернуть её на экран входа, скажите; иначе оставлю только в Настройки → Аккаунт.

## Вопрос перед реализацией
Куда должна вести кнопка скачивания — только в **Настройки → Аккаунт** (как сейчас) или вернуть её и на страницу **входа** тоже?
