const sequelize = require('../config/db-connection');
const { DataTypes } = require('sequelize');

const AuthToken = sequelize.define('AuthToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'auth_tokens',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['token']
    },
    {
      fields: ['email']
    }
  ]
});

module.exports = AuthToken;
