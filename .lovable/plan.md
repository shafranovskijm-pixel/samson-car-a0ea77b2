## Диагноз

Логин работает (он локальный, `admin555` в localStorage), а данные CRM не приходят. Все данные идут напрямую в `ammqnssqnhtejoqrgvdh.supabase.co`. Домен `*.supabase.co` в РФ часто блокируется провайдерами и мобильными операторами — поэтому без VPN на телефоне пусто, а на компе через Wi‑Fi другого провайдера может открываться. Nginx на `samson-car.ru` тут ни при чём: сам сайт (HTML/JS/CSS) отдаётся, а запросы к базе блокирует провайдер.

Чтобы подтвердить это точно, а не гадать, нужны две вещи от вас (одним сообщением):

1. Открыть сайт `https://samson-car.ru` на телефоне БЕЗ VPN, войти, зайти в «Клиенты» и сделать скриншот. Затем сдвинуть страницу вниз/обновить.
2. На компьютере (где данные грузятся) в браузере зайти на `https://ammqnssqnhtejoqrgvdh.supabase.co` — если открывается страница «Supabase» — провайдер пропускает; если долго висит/ошибка — блокировка. Повторить на телефоне без VPN.

Если подтвердится блокировка Supabase — единственное настоящее решение: проксировать API базы через ваш домен `api.samson-car.ru`, к которому у провайдеров доступ есть, и переключить приложение на этот адрес.

## План (после подтверждения)

### 1. Добавить прокси Supabase в nginx на `api.samson-car.ru`

Готовый блок для вашего конфига (пришлю точный текст, вы скопируете в SSH):

```nginx
location /supabase/ {
    proxy_pass https://ammqnssqnhtejoqrgvdh.supabase.co/;
    proxy_set_header Host ammqnssqnhtejoqrgvdh.supabase.co;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_ssl_server_name on;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 300s;
    proxy_buffering off;
}
```

Проверка: `curl https://api.samson-car.ru/supabase/auth/v1/health` должен ответить `{"date":...}`.

### 2. Переключить приложение на прокси

- В `.env` сменить `VITE_SUPABASE_URL` на `https://api.samson-car.ru/supabase` (или задать переменную в панели Timeweb).
- Пересобрать и задеплоить.
- Ключ `SUPABASE_PUBLISHABLE_KEY` остаётся тот же.

### 3. Проверить, что работает без VPN

- Открыть сайт на телефоне БЕЗ VPN.
- Войти → зайти в «Клиенты», «Расходы», «Мастера» → данные должны появиться.
- Открыть в мобильном браузере DevTools или Eruda и убедиться, что запросы идут на `api.samson-car.ru/supabase/...` и возвращают 200, а не таймаут.

### 4. Что сейчас НЕ буду делать

- Не буду ломать текущий nginx для основного сайта — блок `location /supabase/` добавляется параллельно, `try_files` для SPA остаётся.
- Не буду добавлять новые фичи или трогать логику CRM.
- Не трогаю Electron‑сборку — она уже работает через тот же Supabase URL и после смены переменной тоже пойдёт через прокси.

## Первый шаг сейчас

Подтвердите, пожалуйста:
- Открывается ли `https://ammqnssqnhtejoqrgvdh.supabase.co` в браузере на телефоне без VPN?
- Готовы ли добавить блок `location /supabase/` в ваш nginx на `api.samson-car.ru` (у вас есть SSH‑доступ)?

Как только подтвердите — сразу переключаю приложение на прокси и проверяю.
