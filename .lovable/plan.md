
## Что делаем

Новая вкладка **«Расходы»** (`/expenses`) с финансовой сводкой за месяц + учёт авансов мастерам + настройка ставки ЗП по услуге (по умолчанию 50%).

## Формулы

- **Оборот за месяц** = сумма `total_price` по `appointments` со статусом `done` за месяц.
- **ЗП мастеров за месяц** = сумма `mechanic_payout` по `appointment_services` этих appointments.
- **Прочие расходы за месяц** = сумма записей в новой таблице `expenses`.
- **Прибыль за месяц** = Оборот − ЗП мастеров − Прочие расходы.
- **К выплате мастеру** за период = его `mechanic_payout` − его авансы за период.

## База данных (миграция)

1. `expenses` — свободная категория расходов:
   - `spent_at date`, `amount numeric`, `title text`, `note text`
   - RLS: authenticated — полный доступ; service_role — all
2. `mechanic_advances` — авансы мастерам:
   - `mechanic_id uuid → mechanics`, `paid_at date`, `amount numeric`, `note text`
3. `services.default_payout_percent numeric default 50` — процент по умолчанию для расчёта payout мастера.
4. При создании/обновлении `appointment_services` `mechanic_payout` уже проставляется руками из UI — не трогаем. Добавляем helper в калькуляторе/AppointmentDialog: если у мастера нет индивидуальной ставки в `mechanic_service_rates`, использовать `price * services.default_payout_percent / 100` (сейчас там 50% хардкод в компоненте — заменим на чтение процента услуги).

## Настройка ставок

- В `settings.tsx` (раздел «Услуги»): у каждой услуги добавить поле «% мастеру по умолчанию» (default 50).
- Индивидуальная ставка мастера на услугу уже есть (`mechanic_service_rates.amount` — фикс. сумма). Оставляем как приоритетный override.

## UI: `/expenses`

Одна страница с фильтром «Месяц» (по умолчанию текущий) и вкладками:

1. **Сводка**
   - Карточки: Оборот, ЗП мастеров, Прочие расходы, **Чистая прибыль**.
   - Таблица «Прочие расходы» с кнопкой «Добавить» (дата, сумма, название, заметка) и удалением с подтверждением.

2. **По мастерам**
   - Список мастеров: за выбранный месяц — начислено (сумма payout), выдано авансов, к выплате.
   - Разворот мастера: список услуг за месяц (дата, клиент, услуга, цена, payout) + список авансов с добавлением/удалением.

3. **По услугам**
   - Топ услуг за месяц: кол-во, выручка, суммарный payout мастерам, маржа.

## Файлы

- Новая миграция: `expenses`, `mechanic_advances`, `services.default_payout_percent` + RLS + GRANTs.
- `src/lib/api.ts` — CRUD для `expenses`, `mechanic_advances`; `listAppointments(from,to)` уже есть.
- `src/routes/expenses.tsx` — новая страница.
- `src/components/AppSidebar.tsx` — пункт «Расходы».
- `src/routes/settings.tsx` — поле процента в форме услуги.
- `src/components/AppointmentDialog.tsx` / калькулятор — при подстановке payout, если нет `mechanic_service_rates`, брать `price * default_payout_percent/100`.

## Не трогаем

Существующие таблицы appointments/appointment_services/services кроме добавления одного столбца; логику каталога машин и пользовательских услуг.
