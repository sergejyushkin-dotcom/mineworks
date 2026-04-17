const sequelize = require('../config/db-connection');
const { DataTypes } = require('sequelize');

const Recipient = sequelize.define('Recipient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('director', 'engineer', 'ecologist'),
    allowNull: false,
    defaultValue: 'engineer'
  },
  full_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: 'recipients',
  timestamps: true,
  underscored: true
});

module.exports = Recipient;
