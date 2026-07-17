## Переработка калькулятора

Перевернуть флоу: сначала авто (марка → год → модель → модификация), потом услуги. Справочник авто из загруженного JSON, значки марок. Память популярных услуг и цен — и в localStorage (мгновенно, офлайн), и в облаке (синк между устройствами).

### Шаги

**1. Каталог авто (JSON справочник)**
- Скопировать `hyperauto-cars-popular.json` в `src/data/cars-catalog.json` (~5 МБ, ~1780 моделей, ~7000 модификаций).
- Модуль `src/lib/cars-catalog.ts`: типы + `getBrands()`, `getYears(brand)`, `getModels(brand, year)`, `getModifications(brand, year, model)`, `searchBrands(q)`, `popularBrands()` (Honda, Hyundai, Kia, Lexus, Mazda, Mitsubishi, Nissan, Subaru, Suzuki, Toyota).

**2. Логотипы марок**
- CDN `https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset/logos/thumb/<brand>.png`, fallback — инициалы в круге.
- `src/components/BrandLogo.tsx`.

**3. Новый шаг 1 — «Выберите марку»**
- Как на референсе: «Популярные марки» (плитки со значками) + «Все марки» с поиском и колоночным списком.
- После марки — год (горизонтальная лента), модель (список/поиск), модификация (кузов, объём, л.с., топливо).
- «Далее — выбрать услуги» активна после выбора модификации.

**4. Шаг 2 — услуги**
- Оставить текущие категории с картинками.
- Наверху блок «Популярные услуги» — топ-6 по счётчику использования.

**5. Шаг 3 — оформление**
- Оставить, добавить в резюме выбранное авто (марка/год/модель/модификация).

**6. Память популярных услуг (dual: local + cloud)**
- **БД (миграция)**: таблица `service_usage_stats` (`service_id` PK, `count` int, `last_used_at` timestamptz). RLS: чтение/запись `authenticated`, чтение `anon`.
- **Локально**: `localStorage["calc:service-usage"]` — тот же формат.
- Хук `useServiceUsage()`:
  - при загрузке — читает local сразу, потом мержит облако (max count, max lastAt) и пишет обратно.
  - `bump(serviceIds[])` при переходе с услуг: увеличивает счётчики локально + upsert в Supabase (без ожидания).
- Топ = сортировка по count с затуханием по давности.

**7. Память цен (dual: local + cloud)**
- **БД**: существующая `service_prices` (`service_id`, `brand_id`, `price`) уже подходит — используем её как облако.
- **Локально**: `localStorage["calc:price-overrides"]` — `{ "{brand_id}:{service_id}": price }` для мгновенного применения и оффлайн-режима.
- Хук `usePriceOverrides(brand_id)`:
  - читает local + `listPricesForBrand(brand_id)`, мержит (облако — истина при конфликте на онлайне, local — фолбек оффлайн).
  - `setPrice(service_id, price)` → сразу local + `upsertServicePrice` в облако.
  - `resetPrice(service_id)` → чистит local + `deleteServicePrice`.
- В шаге услуг рядом с ценой — карандаш (inline-редактор), кнопка «Сбросить».
- `priceOf()` приоритет: override (merged) → base × tier coeff.

### Технические детали

- Файлы: `src/data/cars-catalog.json`, `src/lib/cars-catalog.ts`, `src/components/BrandLogo.tsx`, `src/hooks/useServiceUsage.ts`, `src/hooks/usePriceOverrides.ts`. Переписать `src/routes/calculator.tsx`. API-функции `upsertServiceUsage`, `listServiceUsage` в `src/lib/api.ts`.
- Миграция: `service_usage_stats` + GRANT + RLS (публичное чтение + запись для authenticated; для гостей — только local).
- Матчинг марки JSON → Supabase `brands.name` (case-insensitive); если не найдено — тир `economy`, only base/local overrides.
- Импорт JSON: `import catalog from "@/data/cars-catalog.json"` — Vite инлайнит, работает офлайн.
- Логотипы: CDN jsdelivr; при необходимости позже перенесём в assets.

### Открытые вопросы

Ничего критичного. Если позже понадобится — добавлю миграцию для автосоздания записей `brands`, отсутствующих в БД, при первом сохранении цены для такой марки.
