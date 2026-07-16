## 1. Убрать «Главную», сделать «Калькулятор» стартовой страницей

- `src/routes/index.tsx` — переделать в redirect на `/calculator` (`beforeLoad: () => throw redirect({ to: "/calculator" })`). Существующая логика дашборда (статистика + ближайшие записи) переносится в блок внизу калькулятора (см. пункт 3).
- `src/components/AppSidebar.tsx` — удалить пункт «Главная». Порядок по умолчанию:
  1. Калькулятор
  2. Календарь
  3. Записи по дням
  4. Клиенты
  5. Мастера
  6. Настройки калькулятора

## 2. Drag & Drop в боковом меню с сохранением

- Установить `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- В `AppSidebar` обернуть `SidebarMenu` в `DndContext` + `SortableContext` (vertical). Каждый `SidebarMenuItem` — `useSortable`.
- Иконка «≡» слева от пункта — drag-handle (`{...attributes} {...listeners}`); клик по остальной области по-прежнему открывает ссылку.
- Порядок пунктов хранится в `localStorage` под ключом `sidebar-order-v1` как массив `url`. При старте — читаем и упорядочиваем `items`; неизвестные url добавляются в конец (устойчивость к будущим правкам меню).
- Читаем localStorage через `useEffect`, чтобы не ломать SSR-гидратацию.

## 3. Статистика внизу калькулятора

- В `src/routes/calculator.tsx` под текущим содержимым добавить блок «Статистика»:
  - 4 карточки: Клиентов / Машин / Мастеров / Записей сегодня (из `listClients`, `listCars`, `listMechanics`, `listAppointments` за сегодня).
  - Список «Ближайшие записи» (следующие 7 дней, до 8 штук), как сейчас на главной, со ссылкой «Открыть календарь →».
- Логика и запросы взяты из старой `index.tsx`; сам файл `index.tsx` становится redirect-ом.

## 4. Адаптация под телефон

- **Хедер (`__root.tsx`)**: заголовок «Samson Auto — CRM» на мобильных сокращается до «Samson Auto», часы Уссурийска остаются справа (`UssuriyskClock` уже `hidden sm:flex` — оставим, чтобы в узком экране не ломать хедер; текст сокращается).
- **Общие отступы**: страницы (`calculator`, `calendar`, `clients`, `mechanics`, `schedule`) — `p-4 sm:p-6`, заголовки `text-2xl sm:text-3xl`.
- **Календарь (`calendar.tsx`)**: на экранах < `sm` дефолтный view = `Views.DAY` (неделя нечитаема на телефоне). Toolbar `react-big-calendar` уже адаптивный; высота календаря — `calc(100dvh - 220px)` вместо `100vh` (учтёт адресную строку iOS).
- **Таблицы (клиенты/мастера/расписание)**: обёртка `overflow-x-auto` для горизонтального скролла на узких экранах. Основные списки клиентов и мастеров используем в один столбец на мобильных (`grid-cols-1 md:grid-cols-2`).
- **Диалоги (`AppointmentDialog`, диалоги клиента/мастера)**: `max-h-[90vh]` уже есть; изменить `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` в наиболее плотных строках (клиент/машина, мастер/статус, ставки).
- **Sidebar на мобильных** — уже offcanvas через shadcn Sheet (свайп/кнопка «≡»). DnD внутри Sheet работает так же.

## Файлы

- `src/routes/index.tsx` — заменить на redirect
- `src/components/AppSidebar.tsx` — убрать «Главную», добавить DnD и localStorage
- `src/routes/calculator.tsx` — добавить блок статистики внизу
- `src/routes/__root.tsx` — адаптивный заголовок хедера
- `src/routes/calendar.tsx` — дефолтный view по ширине экрана, `100dvh`
- `src/routes/clients.tsx`, `mechanics.tsx`, `schedule.tsx` — адаптивные отступы/таблицы
- `src/components/AppointmentDialog.tsx` — адаптивные grid-строки
- `package.json` — `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

## Уточнения

Никаких неоднозначностей — задача понятна. По каналу доставки напоминаний (Telegram / Email) жду ответ отдельно.
