const { Router } = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { Recipient, Company, AuthToken } = require('../models');
const { sendMagicLink } = require('../services/emailService');

const router = Router();

// Запрос Magic Link
router.post('/request', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Введите корректный email' });
    }
    
    // Извлекаем домен из email
    const domain = email.split('@')[1];
    const domainPattern = `%@${domain}`;
    
    // Проверяем существование компании с таким доменом
    const company = await Company.findOne({
      where: {
        official_domain: { [Op.like]: domainPattern },
        is_active: true
      },
      include: [{
        model: Recipient,
        as: 'recipients',
        where: { email }
      }]
    });
    
    if (!company) {
      return res.status(403).json({ 
        error: 'Доступ запрещен. Ваш домен не зарегистрирован в системе или компания неактивна.' 
      });
    }
    
    const recipient = company.recipients[0];
    if (!recipient) {
      return res.status(404).json({ 
        error: 'Пользователь с таким email не найден в базе предприятия.' 
      });
    }
    
    // Генерируем токен
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут
    
    // Сохраняем токен в БД
    await AuthToken.create({
      email,
      token,
      expires_at: expiresAt,
      used: false
    });
    
    // Отправляем письмо с Magic Link
    await sendMagicLink(email, token);
    
    res.json({ 
      success: true, 
      message: 'Ссылка для входа отправлена на ваш email. Действует 15 минут.' 
    });
    
  } catch (error) {
    console.error('Auth request error:', error);
    res.status(500).json({ error: 'Ошибка при отправке ссылки для входа' });
  }
});

// Верификация токена и создание сессии
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Токен не предоставлен' });
    }
    
    // Ищем токен в БД
    const authToken = await AuthToken.findOne({
      where: { token },
      include: [{
        model: Recipient,
        as: 'recipient',
        include: [{
          model: Company,
          as: 'company'
        }]
      }]
    });
    
    if (!authToken) {
      return res.status(400).json({ error: 'Неверный токен' });
    }
    
    if (authToken.used) {
      return res.status(400).json({ error: 'Токен уже был использован' });
    }
    
    if (new Date() > authToken.expires_at) {
      return res.status(400).json({ error: 'Срок действия токена истек' });
    }
    
    const recipient = authToken.recipient;
    
    if (!recipient || !recipient.company?.is_active) {
      return res.status(403).json({ error: 'Пользователь не найден или компания неактивна' });
    }
    
    // Создаем JWT токен на 30 дней
    const jwtToken = jwt.sign(
      { 
        email: recipient.email,
        userId: recipient.id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Помечаем токен как использованный
    await authToken.update({ used: true });
    
    // Устанавливаем cookie с токеном
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 дней
    });
    
    // Перенаправляем в личный кабинет
    res.redirect('/dashboard');
    
  } catch (error) {
    console.error('Auth verify error:', error);
    res.status(500).json({ error: 'Ошибка верификации токена' });
  }
});

// Выход из системы
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Выход выполнен успешно' });
});

// Проверка статуса аутентификации
router.get('/status', async (req, res) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.json({ authenticated: false });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const recipient = await Recipient.findOne({
      where: { email: decoded.email },
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'sphere', 'is_active']
      }]
    });
    
    if (!recipient || !recipient.company?.is_active) {
      res.clearCookie('token');
      return res.json({ authenticated: false });
    }
    
    res.json({
      authenticated: true,
      user: {
        id: recipient.id,
        email: recipient.email,
        fullName: recipient.full_name,
        role: recipient.role,
        company: {
          id: recipient.company.id,
          name: recipient.company.name,
          sphere: recipient.company.sphere
        }
      }
    });
    
  } catch (error) {
    res.clearCookie('token');
    res.json({ authenticated: false });
  }
});

module.exports = router;
