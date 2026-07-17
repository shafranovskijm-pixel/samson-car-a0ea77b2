## Что добавить

### 1. В форму записи (`AppointmentDialog`)
Под селектом «Добавить услугу» — компактная форма ручного добавления:
- **Категория** (Select со списком существующих категорий из `services`, плюс «Другое» с полем текста)
- **Название услуги** (Input)
- **Цена, ₽** (Input number)
- Кнопка «Добавить свою услугу»

Форма активна только если у выбранной машины есть brand + model + year (иначе disabled с подсказкой «Выберите машину с годом»). Год берётся из `selectedCar.year`, бренд — из `selectedCar.brand.name`, модель — из `selectedCar.model`.

### 2. Запоминание за машиной
Использовать существующий хук `useCarCustomServices(brand, model, year)`:
- Сохраняет запись в таблицу `car_custom_services` (облако) и в `localStorage` — уже реализовано.
- При открытии диалога кастомные услуги этой марки/модели/года подтягиваются и показываются:
  - в основном селекте «Добавить услугу» — отдельной группой сверху «Сохранённые для этой машины» с пометкой категории;
  - у каждой строки кнопка-крестик «удалить сохранённую» (с `confirm()`).

Так как `selected: SvcRow[]` жёстко привязан к `service_id` из таблицы `services`, для кастомных услуг введём отдельное поле в строке: `custom?: { name, category }` и допустим `service_id = null`. Сохранение записи в БД: перед `createAppointment`/`updateAppointment` для каждой custom-услуги без `service_id` создаём/находим запись в `services` (upsert по `category+name`) с `base_price=price` и подставляем полученный id. Это позволяет не менять API-слой и сохранить связь `appointment_services.service_id`.

### 3. Статистика популярности
Уже есть `useServiceUsage`:
- В `AppointmentDialog` при успешном сохранении — вызывать `bump(selected.map(s => s.service_id))` (после разрешения id для кастомных).
- В `calculator.tsx` при выборе услуг — сортировать список по `topServiceIds()` (популярные сначала, остальные — по алфавиту/категории). Добавить визуальную метку «⭐ Популярное» для топ-6.

### 4. Файлы
- `src/components/AppointmentDialog.tsx` — форма ручного ввода, интеграция `useCarCustomServices`, поддержка кастомных строк, upsert в `services` при сохранении, `bump` статистики.
- `src/routes/calculator.tsx` — сортировка каталога услуг по популярности + бейдж.
- `src/lib/api.ts` — маленький хелпер `upsertServiceByCategoryName(category, name, price)`.

### 5. Что не трогаем
- Схема БД (все нужные таблицы уже есть: `services`, `car_custom_services`, `service_usage_stats`).
- Логика оплат, статусов, авансов, печати.

### Технические детали
- Кастомные строки в `selected`: `{ service_id: null, custom: { name, category }, price, mechanic_payout }`. Тип `SvcRow` расширить, во всех местах фильтрации по `service_id` — учитывать null.
- В UI для кастомной строки показываем `custom.name` / `custom.category` вместо lookup по `services`.
- Порядок сортировки в `calculator`: сначала top (score > 0), затем остальные в текущем порядке; бейдж рендерится только для id из `topServiceIds(6)`.
