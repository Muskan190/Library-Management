const { sequelize } = require('../config/db');
const Book = require('./bookModel');
const User = require('./userModel');
const Issue = require('./Issue');


// Define associations here
Book.hasMany(Issue, { foreignKey: 'BookId' });
Issue.belongsTo(Book, { foreignKey: 'BookId' });
User.hasMany(Issue, { foreignKey: 'UserId'});
Issue.belongsTo(User, { foreignKey: 'UserId' });

module.exports = { sequelize, Book, User, Issue};