const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Book = sequelize.define(
  "Book",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING,
      allowNull:false,
    },
  },
  {
    timestamps: false,
  }
);

Book.sync({ alter: true }).then(() => {
  console.log("Book table synced successfully!");
});

module.exports = Book;
