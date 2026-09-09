# Environments та деплой

## Огляд середовищ

| Environment | Хостинг | URL | Призначення |
|---|---|---|---|
| **Тестовий** | Netlify — сайт `tavriya-schedule-live` (id `16f254a1-3707-413c-879a-b388f15ef6a8`) | https://tavriya-schedule-live.netlify.app | Перевірка змін перед продом |
| **Прод #1** | Render — статичний сайт `tavriya-schedule` (конфіг `render.yaml`) | див. Render dashboard | Продакшн |
| **Прод #2** | Власний сервер по SSH (скрипт `deploy.ps1`) | `http://$SSH_HOST/schedule/` (КФКМГ) | Продакшн (підшлях `/schedule/`) |

## Таблиці Google Sheets

| Таблиця | URL | Де використовується |
|---|---|---|
| **Prod** | `https://docs.google.com/spreadsheets/d/1pl0PFC1jJ-75NUjiePCFvZuae8qpUQ4cBYxAfsi0ULQ/export?format=csv&gid=0` | Render (змінна в dashboard), SSH-деплой на КФКМГ + локальні збірки (`.env`, `client/.env`) |
| **Тестова** | `https://docs.google.com/spreadsheets/d/e/2PACX-1vRhg25lMmSQy84JzCAclh2A-rIntzK50o6PZ2CrhTDUYWU0W78YEvPmJnTtZztee1JeJ5VZPgAOxwh4/pub?output=csv` | Netlify (змінна `VITE_GOOGLE_SHEETS_URL` задана через `netlify env:set`, усі контексти) |

**Важливо:** URL для Netlify заданий у налаштуваннях сайту (`netlify env:set`), тому він не залежить від локальних `.env`. Локальні `.env` завжди мають вказувати на prod-таблицю — саме з них збирається SSH-деплой на КФКМГ. Не міняйте `VITE_GOOGLE_SHEETS_URL` у локальних `.env` на тестову таблицю.

## Тестовий: Netlify

Сайт лінкований локально (стан у `.netlify/`, ця папка в `.gitignore` і не комітиться).

```bash
netlify deploy --prod     # збірка + деплой на https://tavriya-schedule-live.netlify.app
netlify deploy            # чернетковий деплой (draft URL) — якщо треба подивитись без публікації
netlify status            # перевірка лінковки
```

- Команда збірки та publish-папка (`dist`) беруться з налаштувань сайту в UI Netlify (локальна копія — `.netlify/netlify.toml`): `npm run build`, publish `dist`.
- URL таблиці (тестова) заданий через `netlify env:set VITE_GOOGLE_SHEETS_URL ...` і підміняє локальний `.env` під час збірки.
- Netlify = єдиний тестовий environment. **Прод-зміни сюди не потрапляють**, поки їх не задеплоять на Render або SSH окремо.

## Прод #1: Render

- Конфіг — `render.yaml` (Blueprint, static site): `npm install && npm run build`, publish `./dist`.
- Змінна середовища `VITE_GOOGLE_SHEETS_URL` ставиться вручну в Render dashboard.
- Деплой: через Render dashboard (auto-deploy з git) або `deploy.bat render`.

## Прод #2: SSH-сервер

Скрипт — `deploy.ps1` (єдиний наявний деплой-скрипт у корені):

```powershell
.\deploy.ps1
```

- Читає `.env` (не комітиться): `SSH_HOST`, `SSH_USER`, `REMOTE_PATH`, опційно `SSH_PORT`, `SSH_KEY_PATH`. Змінна `VITE_GOOGLE_SHEETS_URL` звідси ж потрапляє в білд — тому `.env` має вказувати на **prod-таблицю**.
- Білдить `npm run build:main` — тобто з базою `/schedule/` (сайти розгортаються у підпапці).
- Заливає `dist/*` на сервер через `scp`.

## Скрипти package.json

| Скрипт | Що робить |
|---|---|
| `npm run dev` | Dev-сервер Vite (локальна розробка) |
| `npm run build` | Звичайний білд (Netlify, Render) |
| `npm run build:main` | Білд з `--base=/schedule/` (для SSH-сервера) |
| `npm run deploy` | `deploy.ps1` → SSH |
| `npm run deploy:main` / `deploy:win` / `deploy:main:win` | Посилаються на `deploy.sh` / `deploy.bat`, яких **немає в репозиторії** — не працюють без них |

## Порядок релізу

1. Перевірити зміни локально (`npm run dev`) — типи `npx tsc --noEmit`, тести `npm test`.
2. Задеплоїти на **Netlify** (тестовий) і перевірити в браузері.
3. Після підтвердження — деплой на прод: Render (dashboard/auto-deploy) та/або SSH (`.\deploy.ps1`).
