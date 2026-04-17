const sequelize = require('../config/db-connection');

// Импорт моделей
const Company = require('./Company');
const Recipient = require('./Recipient');
const AuthToken = require('./AuthToken');
const Document = require('./Document');
const Broadcast = require('./Broadcast');

// Определение связей
Company.hasMany(Recipient, { foreignKey: 'company_id', as: 'recipients' });
Recipient.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

Document.hasMany(Broadcast, { foreignKey: 'document_id', as: 'broadcasts' });
Broadcast.belongsTo(Document, { foreignKey: 'document_id', as: 'document' });

// Синхронизация моделей (для разработки)
const syncModels = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✓ Database models synchronized');
  } catch (error) {
    console.error('✗ Database sync error:', error);
  }
};

module.exports = {
  sequelize,
  Company,
  Recipient,
  AuthToken,
  Document,
  Broadcast,
  syncModels
};
