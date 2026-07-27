# Прокси Supabase через api.samson-car.ru (обход блокировки без VPN)

## Зачем

Провайдеры в РФ часто блокируют `*.supabase.co`. Сайт (HTML/JS/CSS) грузится
с вашего домена, а запросы к базе уходят напрямую на `supabase.co` и виснут —
поэтому CRM пустая без VPN. Решение: прокинуть API базы через ваш домен
`api.samson-car.ru`, к которому у провайдеров доступ есть.

## Шаг 1. Добавить блок в nginx

Подключитесь по SSH к серверу и откройте конфиг сайта `api.samson-car.ru`
(обычно `/etc/nginx/sites-available/api.samson-car.ru` или похожий).

Внутри существующего `server { ... listen 443 ssl; server_name api.samson-car.ru; ... }`
добавьте блок `location /supabase/` **рядом** с текущим `location /` — не
удаляйте и не меняйте существующие location:

```nginx
location /supabase/ {
    # ВАЖНО: слеш в конце proxy_pass — он срезает /supabase/ из пути.
    proxy_pass https://ammqnssqnhtejoqrgvdh.supabase.co/;

    # Только Host. НЕ добавлять X-Real-IP / X-Forwarded-For —
    # Cloudflare перед Supabase считает их подменой IP и возвращает 404.
    proxy_set_header Host ammqnssqnhtejoqrgvdh.supabase.co;

    # SNI для правильного TLS-хендшейка с Cloudflare
    proxy_ssl_server_name on;
    proxy_ssl_name ammqnssqnhtejoqrgvdh.supabase.co;

    # WebSocket (Realtime) — пробрасываем Upgrade только если он есть
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;

    # Убираем свои X-Forwarded-* если где-то выше уже добавлены
    proxy_set_header X-Real-IP "";
    proxy_set_header X-Forwarded-For "";
    proxy_set_header X-Forwarded-Proto "";
    proxy_set_header X-Forwarded-Host "";

    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
    proxy_buffering off;
}
```

Один раз в самом верху `nginx.conf` (в блоке `http { ... }`) должно быть:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

Проверка и перезагрузка:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Шаг 2. Убедиться, что прокси работает

С любого устройства (в том числе с телефона без VPN):

```bash
curl -i https://api.samson-car.ru/supabase/auth/v1/health
```

Ожидается ответ 200 с JSON вида `{"date":"...","description":"...","name":"GoTrue"}`.
Если 502/504 — nginx не может достучаться до Supabase с самого сервера (проверьте,
что сервер не в РФ, либо что провайдер сервера не блокирует Supabase).

## Шаг 3. Переключить приложение на прокси

В `.env` заменить только одну переменную:

```
VITE_SUPABASE_URL="https://api.samson-car.ru/supabase"
```

`VITE_SUPABASE_PUBLISHABLE_KEY` не меняется. После этого:

1. Пересобрать (Timeweb соберёт сам после git push).
2. Открыть сайт на телефоне БЕЗ VPN → войти → зайти в «Клиенты», «Расходы»,
   «Мастера» → данные должны появиться.

## Откат

Если что-то пошло не так — верните `VITE_SUPABASE_URL` обратно на
`https://ammqnssqnhtejoqrgvdh.supabase.co` и пересоберите. Блок
`location /supabase/` в nginx можно оставить — он не мешает основному сайту.
