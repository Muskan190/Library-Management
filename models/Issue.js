const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Issue = sequelize.define('Issue', {
  issueTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  returnTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  
  fine: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
    userName: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  bookName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  finePaid:{
    type:DataTypes.BOOLEAN,
    defaultValue:false
  }
  
  
});

module.exports = Issue;
  