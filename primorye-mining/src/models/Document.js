const sequelize = require('../config/db-connection');
const { DataTypes } = require('sequelize');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  importance: {
    type: DataTypes.ENUM('normal', 'urgent'),
    defaultValue: 'normal'
  },
  category: {
    type: DataTypes.ENUM('document', 'event', 'alert'),
    defaultValue: 'document'
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  pdf_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  qr_code: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  sender_email: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: 'documents',
  timestamps: true,
  underscored: true
});

module.exports = Document;
