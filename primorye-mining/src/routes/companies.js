const { Router } = require('express');
const { Company, Recipient } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = Router();

// Получение списка всех активных компаний
router.get('/', authenticate, async (req, res) => {
  try {
    const companies = await Company.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']],
      include: [{
        model: Recipient,
        as: 'recipients',
        attributes: ['id', 'email', 'role', 'full_name']
      }]
    });
    
    res.json(companies);
    
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Ошибка получения списка компаний' });
  }
});

// Получение списка отраслей
router.get('/spheres', authenticate, async (req, res) => {
  try {
    const spheres = [
      { value: 'coal', label: 'Угольная промышленность', color: '#2c2c2c' },
      { value: 'oil_gas', label: 'Нефтегазовый сектор', color: '#d4a017' },
      { value: 'service', label: 'Геологоразведка и сервис', color: '#6b7280' }
    ];
    
    // Подсчет количества компаний в каждой сфере
    const counts = await Company.findAll({
      where: { is_active: true },
      attributes: [
        'sphere',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['sphere']
    });
    
    const spheresWithCount = spheres.map(sphere => ({
      ...sphere,
      count: counts.find(c => c.sphere === sphere.value)?.count || 0
    }));
    
    res.json(spheresWithCount);
    
  } catch (error) {
    console.error('Get spheres error:', error);
    res.status(500).json({ error: 'Ошибка получения списка отраслей' });
  }
});

// Получение статистики по компаниям
router.get('/stats', authenticate, async (req, res) => {
  try {
    const totalCompanies = await Company.count({ where: { is_active: true } });
    const totalRecipients = await Recipient.count({
      include: [{
        model: Company,
        as: 'company',
        where: { is_active: true }
      }]
    });
    
    const bySphere = await Company.findAll({
      where: { is_active: true },
      attributes: [
        'sphere',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['sphere']
    });
    
    res.json({
      totalCompanies,
      totalRecipients,
      bySphere: bySphere.reduce((acc, item) => {
        acc[item.sphere] = item.count;
        return acc;
      }, {})
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

module.exports = router;
