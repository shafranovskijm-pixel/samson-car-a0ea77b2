## Что не так сейчас

На скриншоте у вас:
- Команда сборки: `npm install && npm run build`
- Директория сборки: `/dist`

Проблема: проект собран на **TanStack Start (SSR)**. Команда `npm run build` создаёт бандл под Cloudflare Worker в `.output/`, а не статику в `/dist`. Поэтому Timeweb получает пустую папку → 404 на `samson-car.ru`.

Приложению отдельный backend не нужен — оно ходит в Lovable Cloud (Supabase) напрямую из браузера. Значит, нужна чистая статическая SPA-сборка.

## План действий

### 1. Переключить проект на статическую SPA-сборку (я сделаю в коде)

- В `vite.config.ts` включить SPA-режим TanStack Start и preset `static` для Nitro. Это отключит SSR и на выходе появится обычный `index.html` со всеми ассетами.
- В `package.json` добавить скрипт `build:static`, который собирает и копирует результат в папку `dist/` (то, что уже прописано у вас на Timeweb).
- Проверить локально: после сборки в `dist/index.html` должен быть готовый SPA.

### 2. Настройки в панели Timeweb (вы вводите руками)

- **Фреймворк:** React
- **Версия окружения:** 20 или выше (24 тоже подойдёт)
- **Команда сборки:** `npm install && npm run build:static`
- **Директория сборки:** `dist`
- **Переменные окружения** (уже добавлены, проверьте значения):
  - `VITE_SUPABASE_URL` = `https://ammqnssqnhtejoqrgvdh.supabase.co`
  - `VITE_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_BDcC69d_k3MLTlPA5QCu7w_xsm4Maxm`
  - `VITE_SUPABASE_PROJECT_ID` = `ammqnssqnhtejoqrgvdh`
- **Ветка:** `main`

### 3. nginx (SPA fallback)

Чтобы прямые ссылки типа `samson-car.ru/calculator` не давали 404, в конфиге nginx для домена `samson-car.ru` в блоке `location /` должно быть:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

nginx на `api.samson-car.ru` приложению не нужен — можно оставить как есть, всё общение с базой идёт напрямую в Supabase по HTTPS.

### 4. Проверка после деплоя

- Открыть `https://samson-car.ru` — должна загрузиться главная.
- Перейти на `/calculator`, обновить страницу (F5) — не должно быть 404 (это проверяет SPA fallback из шага 3).
- Открыть DevTools → Network — должны идти запросы на `ammqnssqnhtejoqrgvdh.supabase.co` со статусом 200 (это проверяет переменные из шага 2).

## Что НЕ меняю

- Логику приложения, компоненты, БД — не трогаю.
- Существующий `npm run build` (для деплоя в Lovable) остаётся рабочим, добавляю параллельный `build:static`.

Скажите «ок» — начну с шага 1 (правки в коде), потом проведу вас по шагам 2–4.