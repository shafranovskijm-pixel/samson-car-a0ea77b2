
## Что делаем

1. **Статистика — отдельный пункт меню** (`/stats`), с дебиторкой.
2. **Убрать `<AdminStats />` из калькулятора** — там ей не место.
3. **В «Записях по дням» — переключатели-кнопки**: статус работы и статус оплаты, меняются по клику прямо в карточке.

---

## 1. База — новое поле «статус оплаты»

Миграция добавляет к `appointments`:

- `payment_status` — `paid` / `prepaid` / `unpaid` (по умолчанию `unpaid`).
- `paid_amount numeric` — сколько фактически получено (для «предоплаты» и дебиторки).

Дебиторка считается как `SUM(total_price - paid_amount)` по записям со статусом работы `done` и оплатой ≠ `paid`.

## 2. Типы и API (`src/lib/types.ts`, `src/lib/api.ts`)

- `PaymentStatus = "paid" | "prepaid" | "unpaid"` + `PAYMENT_LABELS` + `PAYMENT_COLORS`.
- В типе `Appointment` — новые поля.
- В `api.ts` — `updateAppointmentPayment(id, { payment_status, paid_amount })` и `updateAppointmentStatus(id, status)` (короткий патч без пересохранения услуг).

## 3. Меню (`src/components/AppSidebar.tsx`)

В `DEFAULT_ITEMS` добавляем пункт **«Статистика»** → `/stats` (иконка `BarChart3`). Порядок в localStorage переживёт добавление — новый пункт просто допишется в конец.

## 4. Калькулятор (`src/routes/calculator.tsx`)

Удаляем импорт и рендер `<AdminStats />` (строки 45 и 600).

## 5. Новая страница `/stats` (`src/routes/stats.tsx`)

Использует существующий компонент `AdminStats` (клиенты/машины/мастера/сегодня + ближайшие записи) и добавляет блок **«Дебиторка»**:

- Сумма долга (итого не оплачено по завершённым работам).
- Список должников: клиент, машина, дата визита, `total_price − paid_amount`, кнопка «Открыть запись».
- Заголовок страницы + head-мета.

## 6. «Записи по дням» (`src/routes/schedule.tsx`)

В карточке визита правый блок заменяем на два ряда кнопок-переключателей:

- **Статус работы** — цикл `scheduled → in_progress → done → cancelled → scheduled`. Клик по бейджу-кнопке → `updateAppointmentStatus` + invalidate `appointments`. Цвет — из `STATUS_COLORS`.
- **Статус оплаты** — цикл `unpaid → prepaid → paid → unpaid`. При переходе в `paid` — `paid_amount = total_price`; в `unpaid` — `0`; в `prepaid` — оставляем текущее (либо `total_price/2` при первом клике, если 0). Клик → `updateAppointmentPayment` + invalidate.

Чтобы клик по кнопкам не открывал диалог редактирования, оборачиваю карточку в `div` вместо `button`, а название/детали делаю кликабельными для открытия диалога. `stopPropagation` на кнопках статусов.

Добавляется фильтр по статусу оплаты рядом со статусом работы (по аналогии).

## Технические детали

- Миграция включает `GRANT` уже покрыт (таблица существует), только `ALTER TABLE ADD COLUMN` + `UPDATE` дефолтов для существующих строк (unpaid, paid_amount = 0).
- `updateAppointmentPayment` / `updateAppointmentStatus` — точечные `update` по id, чтобы не тянуть весь `updateAppointment` с услугами.
- `AdminStats` расширяю: принимает опциональный проп `showDebtors` — на `/stats` показывает блок дебиторки; на других экранах не используется.

## Файлы

```text
migration           add appointments.payment_status + paid_amount
src/lib/types.ts               +PaymentStatus, поля в Appointment
src/lib/api.ts                 +updateAppointmentStatus, updateAppointmentPayment; select включает новые поля
src/components/AppSidebar.tsx  +пункт «Статистика»
src/routes/calculator.tsx      -AdminStats
src/components/AdminStats.tsx  +опц. блок «Дебиторка»
src/routes/stats.tsx           новый роут
src/routes/schedule.tsx        кнопки-переключатели статусов + фильтр оплаты
```
