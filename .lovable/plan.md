## Цель
Пересобрать Windows-версию SamsonCRM (Electron) со всеми последними изменениями (пивот-таблица расходов, категории каталога, оплаты и т.д.), проверить работоспособность и обновить ссылку на скачивание в Настройках.

## Шаги

1. **Подготовка сборки**
   - Убедиться, что `vite.electron.config.ts` актуален (`base: './'`, outDir `dist-electron-web`).
   - Проверить `electron/main.cjs` и `scripts/fix-electron-paths.cjs`.

2. **Сборка web-части для Electron**
   - `npx vite build --config vite.electron.config.ts`
   - Прогнать `scripts/fix-electron-paths.cjs` (относительные пути + hash router).

3. **Упаковка Electron**
   - `npx @electron/packager . "SamsonCRM" --platform=win32 --arch=x64 --out=electron-release --overwrite` с игнором `src/`, `public/`, `node_modules-исходников`, `electron-release`.
   - Проверить содержимое `app.asar` через `scripts/verify-electron-package.cjs` (наличие `dist-electron-web/client/index.html`, JS+CSS ассетов).

4. **Проверка (обязательно перед публикацией)**
   - Запустить `verify-electron-package.cjs` — падение = стоп.
   - Дополнительно: распаковать asar и убедиться, что бандл содержит новые модули (пивот-таблица `ExpensesMonthlyTable`, категории `service_categories` в API, обновлённая логика `listPaymentsRange`).
   - Отключить сеть через `NODE_OPTIONS`/переменные не нужно — проверим, что оффлайн-кэш (`offlineCache v2`) присутствует в бандле поиском строки.

5. **Загрузка в Lovable Assets**
   - Заархивировать `electron-release/SamsonCRM-win32-x64/` в zip.
   - `lovable-assets create --file <zip>` → получить новый URL.
   - Перезаписать `src/assets/downloads/SamsonCRM-windows.zip.asset.json` новым pointer JSON.

6. **Финальная проверка**
   - Прочитать обновлённый `.asset.json`, убедиться что размер >100 МБ и content-type `application/zip`.
   - Открыть `/settings?tab=account` и проверить, что кнопка «Скачать для Windows» ведёт на новый URL (размер обновится в подписи, если он захардкожен — поправить текст «~138 МБ» на актуальный).

## Технические детали
- Сборка занимает 3-5 минут, упаковка ещё ~2 минуты — использовать таймауты 300+ сек.
- Кросс-компиляция win32 с Linux поддерживается `@electron/packager` без дополнительных инструментов.
- Если `verify-electron-package.cjs` упадёт — не публиковать asset, вернуть ошибку пользователю.
- Обещание «не говорить готово, пока не проверю» выполняется через обязательный запуск verify-скрипта + чтение содержимого asar перед загрузкой.

## Что НЕ меняется
- Никаких изменений в бизнес-логике, UI, БД — только пересборка и загрузка бинарника.
