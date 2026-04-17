const sequelize = require('../config/db-connection');
const { DataTypes } = require('sequelize');

const Broadcast = sequelize.define('Broadcast', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  document_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'documents',
      key: 'id'
    }
  },
  sphere_filter: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    comment: 'Фильтр по отраслям: coal, oil_gas, service'
  },
  recipient_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('pending', 'sending', 'completed'),
    defaultValue: 'pending'
  },
  excluded_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'broadcasts',
  timestamps: true,
  underscored: true
});

module.exports = Broadcast;
