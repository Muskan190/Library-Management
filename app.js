const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const bookRoutes = require("./routes/bookRoutes");
const issueRoutes = require("./routes/issueRoutes");
const { connectDB, sequelize } = require("./config/db");
const PORT = 5000;

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use("/users", userRoutes);
app.use("/books", bookRoutes);
app.use("/issues", issueRoutes);

sequelize
  .sync({ force: false })
  .then(() => console.log("Database synced"))
  .catch((err) => console.error("Sync error:", err));

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () =>
    console.log(`Server is running on http://localhost:${PORT}`)
  );
};

startServer();
