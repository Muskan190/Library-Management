const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Issue = require('./Issue');

const FinePayment = sequelize.define('FinePayment', {
  amountPaid: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  paymentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

sequelize.sync() 
  .then(() => {
    console.log("Database & tables created!");
  })

FinePayment.belongsTo(Issue, { foreignKey: 'IssueId' });

module.exports = FinePayment;
