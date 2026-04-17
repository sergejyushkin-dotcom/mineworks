const sequelize = require('../config/db-connection');
const { DataTypes } = require('sequelize');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  sphere: {
    type: DataTypes.ENUM('coal', 'oil_gas', 'service'),
    allowNull: false
  },
  official_domain: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmailDomain: true
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'companies',
  timestamps: true,
  underscored: true
});

module.exports = Company;
