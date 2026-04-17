const jwt = require('jsonwebtoken');
const { Recipient, Company } = require('../models');

// Middleware для проверки аутентификации
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Проверяем существование получателя
    const recipient = await Recipient.findOne({
      where: { email: decoded.email },
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'sphere', 'is_active']
      }]
    });

    if (!recipient || !recipient.company?.is_active) {
      return res.status(401).json({ error: 'Пользователь не найден или компания неактивна' });
    }

    req.user = {
      id: recipient.id,
      email: recipient.email,
      fullName: recipient.full_name,
      role: recipient.role,
      company: recipient.company
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Неверный токен' });
  }
};

// Middleware для проверки роли администратора
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'director') {
    return res.status(403).json({ error: 'Доступ только для руководителей' });
  }
  next();
};

module.exports = {
  authenticate,
  isAdmin
};
