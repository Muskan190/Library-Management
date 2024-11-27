const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("test", "root", "", {
  host: "localhost",
  dialect: "mysql",
});

sequelize
  .sync()
  .then(() => console.log("Database synced!"))
  .catch((err) => console.log("Error syncing database:", err));

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully!");
  } catch (error) {
    console.error("Error connecting to DB:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
