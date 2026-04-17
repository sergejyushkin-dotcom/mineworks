# Приморский Горный Вестник

Платформа для связи с горняками Приморья, где не нужно помнить пароль, а нужно просто быть в списке.

## Описание

MVP веб-платформы для коммуникации предприятий горной промышленности Приморского края. Проект социальный, направлен на упрощение документооборота и оповещений между регулятором/отраслевым объединением и предприятиями.

## Ключевые особенности

- **Беспарольная авторизация (Magic Link)** - вход по одноразовой ссылке на email
- **Доменная верификация** - доступ только для утвержденных доменов предприятий
- **Длительная сессия** - 30+ дней без повторного входа
- **Фильтрация рассылок** - по отраслям (уголь, нефтегаз, геологоразведка)
- **Электронные документы** - авто-конвертация в PDF с штампом и QR-кодом

## Архитектура

### Технологический стек

- **Backend**: Node.js + Express
- **ORM**: Sequelize
- **Database**: PostgreSQL
- **Queue**: BullMQ + Redis
- **Auth**: JWT + Magic Link
- **Email**: Nodemailer
- **PDF**: PDFKit + QRCode

### Структура проекта

```
primorye-mining/
├── src/
│   ├── config/          # Конфигурация БД, почтового сервиса
│   ├── models/          # Модели данных (Sequelize)
│   ├── controllers/     # Контроллеры бизнес-логики
│   ├── services/        # Сервисы (отправка почты, генерация PDF)
│   ├── middleware/      # Middleware (аутентификация, валидация)
│   └── routes/          # API маршруты
├── public/              # Статические файлы (CSS, JS)
├── views/               # HTML шаблоны
├── uploads/             # Загруженные файлы
└── README.md
```

## Модель данных

### Companies (Предприятия)

```sql
{
  id: UUID,
  name: STRING,                    -- Название предприятия
  sphere: ENUM('coal', 'oil_gas', 'service'),  -- Отрасль
  official_domain: STRING,         -- Официальный домен (@primcoal.ru)
  is_active: BOOLEAN,              -- Активность предприятия
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### Recipients (Получатели)

```sql
{
  id: UUID,
  email: STRING (UNIQUE),          -- Email как идентификатор
  company_id: FK -> Companies,     -- Связь с предприятием
  role: ENUM('director', 'engineer', 'ecologist'),  -- Должность
  full_name: STRING,               -- ФИО
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### AuthTokens (Токены авторизации)

```sql
{
  id: UUID,
  email: STRING,                   -- Email получателя
  token: STRING (UNIQUE),          -- Одноразовый токен
  expires_at: TIMESTAMP,           -- Время жизни (15 минут)
  used: BOOLEAN,                   -- Флаг использования
  created_at: TIMESTAMP
}
```

### Documents (Документы)

```sql
{
  id: UUID,
  title: STRING,                   -- Тема документа
  content: TEXT,                   -- Текст документа
  importance: ENUM('normal', 'urgent'),  -- Важность
  category: ENUM('document', 'event', 'alert'),  -- Категория
  file_path: STRING,               -- Путь к файлу
  pdf_path: STRING,                -- Путь к сгенерированному PDF
  qr_code: STRING,                 -- QR код для проверки
  sender_email: STRING,            -- Email отправителя
  created_at: TIMESTAMP
}
```

### Broadcasts (Рассылки)

```sql
{
  id: UUID,
  document_id: FK -> Documents,    -- Связь с документом
  sphere_filter: ARRAY,            -- Фильтр по отраслям
  recipient_count: INTEGER,        -- Количество получателей
  status: ENUM('pending', 'sending', 'completed'),
  created_at: TIMESTAMP
}
```

## API Endpoints

### Аутентификация

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/auth/request` | Запрос magic link на email |
| GET | `/api/auth/verify` | Верификация токена и создание сессии |
| POST | `/api/auth/logout` | Выход из системы |

### Документы

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/documents` | Получение списка документов (с фильтрацией по вкладкам) |
| GET | `/api/documents/:id` | Получение конкретного документа |
| POST | `/api/documents` | Создание документа с загрузкой файла |
| GET | `/api/documents/:id/pdf` | Скачивание PDF версии документа |

### Рассылки (Админ)

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/broadcasts` | Создание рассылки с фильтрами |
| GET | `/api/broadcasts/preview` | Превью рассылки (кол-во получателей) |
| GET | `/api/broadcasts` | Список всех рассылок |

### Компании

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/companies` | Список всех активных компаний |
| GET | `/api/companies/spheres` | Список отраслей для фильтрации |

## Логика авторизации (Magic Link)

1. Пользователь вводит email (например, `ivanov@primcoal.ru`)
2. Система извлекает домен `@primcoal.ru`
3. Проверка домена в таблице `companies` (поле `official_domain`)
4. Если домен найден и компания активна:
   - Генерируется уникальный токен (UUID)
   - Токен сохраняется в `auth_tokens` с временем жизни 15 минут
   - Отправляется письмо со ссылкой `/auth/verify?token={token}`
5. При переходе по ссылке:
   - Токен проверяется на существование и срок действия
   - Создается JWT сессия на 30 дней
   - Токен помечается как использованный
6. Пользователь перенаправляется в личный кабинет

## Логика рассылок

1. Администратор создает объявление:
   - Заполняет тему, текст, важность
   - Выбирает фильтры получателей (отрасли)
   - Загружает файлы (до 50 Мб)
2. Система показывает превью:
   - «Будет отправлено: 12 компаний, 3 исключено»
3. После подтверждения:
   - Документ конвертируется в PDF с наложением штампа
   - Генерируется QR-код для проверки подлинности
   - Задача добавляется в очередь BullMQ
4. Worker обрабатывает очередь:
   - Выбирает получателей по фильтру (`sphere = 'coal' AND is_active = true`)
   - Отправляет письма через почтовый сервис
   - Обновляет статус рассылки

## Установка и запуск

### Требования

- Node.js >= 18.x
- PostgreSQL >= 14
- Redis >= 6

### Переменные окружения

Создайте файл `.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/primorye_mining

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=30d

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@primvestnik.ru
SMTP_PASS=your-smtp-password
EMAIL_FROM="Приморский Горный Вестник" <noreply@primvestnik.ru>

# App
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Uploads
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads
```

### Запуск

```bash
# Установка зависимостей
npm install

# Миграция БД
npx sequelize-cli db:migrate

# Запуск сервера
npm start

# Запуск worker для очереди
npm run worker
```

## Цветовая схема

- **Темно-синий**: `#1a3a52` - основной фон, шапка
- **Серый бетон**: `#6b7280` - вторичные элементы, текст
- **Охра/Золотой**: `#d4a017` - акценты для нефтегазового сектора
- **Черный уголь**: `#2c2c2c` - акценты для угольной промышленности
- **Белый**: `#ffffff` - контент, карточки

## Лицензия

Проект разработан для социального использования предприятиями горной промышленности Приморского края.
