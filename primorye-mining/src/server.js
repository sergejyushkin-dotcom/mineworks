const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { syncModels } = require('./models');
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const companyRoutes = require('./routes/companies');
const { createBroadcastWorker, getQueueStats } = require('./services/queueService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.BASE_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Статические файлы
app.use(express.static('public'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/companies', companyRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const queueStats = await getQueueStats();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      queue: queueStats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Личный кабинет
app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/views/dashboard.html');
});

// Страница входа
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/views/login.html');
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Внутренняя ошибка сервера'
  });
});

// Запуск сервера и синхронизация БД
const startServer = async () => {
  try {
    // Синхронизация моделей БД
    await syncModels();
    
    // Запуск worker для обработки очереди
    const worker = createBroadcastWorker();
    console.log('✓ Broadcast worker started');
    
    // Запуск сервера
    app.listen(PORT, () => {
      console.log(`\n🏔️  Приморский Горный Вестник`);
      console.log(`📡 Server running on ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
      console.log(`📧 Email from: ${process.env.EMAIL_FROM || 'noreply@primvestnik.ru'}`);
      console.log(`\nРежим: ${process.env.NODE_ENV || 'development'}\n`);
    });
    
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
