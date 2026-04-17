const { Sequelize } = require('sequelize');
const config = require('./database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool
  }
);

// Проверка подключения
sequelize.authenticate()
  .then(() => console.log('✓ PostgreSQL connected'))
  .catch(err => console.error('✗ Database connection error:', err));

module.exports = sequelize;
