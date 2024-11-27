const { sequelize, Book, User, Issue } = require("../models/index");
const { Sequelize } = require("sequelize");
const rabbit = require("../rabbitMQ/rabbit.js");
const rabbitObj = new rabbit();
const FinePayment = require("../models/finePaymentModel.js");
const whiteListUser = async (req, res) => {
  try {
    const { UserId, isWhitelisted } = req.body;
    const whiteListUser = await User.findOne({
      where: { id: UserId },
    });
    if (!whiteListUser) {
      return res.status(400).json({ message: "User doesn't exist!" });
    }
    if (typeof isWhitelisted !== "boolean") {
      return res.status(400).json({ message: "Invalid isWhitelisted value!" });
    }

    whiteListUser.isWhitelisted = isWhitelisted;
    await whiteListUser.save();

    const statusMessage = isWhitelisted
      ? "Successfully whitelisted!"
      : "Successfully removed from whitelist!";

    return res.status(200).json({ message: statusMessage });
  } catch (error) {
    console.error("Error updating whitelist status:", error);
    return res.status(500).json({ message: "Internal server error!" });
  }
};
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const offset = (page - 1) * limit;
    // Fetch users with number of books issued and total outstanding fine
    const userdetail = await User.findAndCountAll({
      attributes: [
        "id",
        "name",
        "isWhitelisted",
        [
          sequelize.literal(
            `(SELECT COUNT(*) FROM Issues WHERE Issues.UserId = User.id)`
          ),
          "booksIssued",
        ],
        [
          sequelize.literal(
            `(SELECT Round(SUM(fine),3) FROM Issues WHERE Issues.UserId = User.id)`
          ),
          "outstandingFine",
        ],
      ],
      limit,
      offset,
    });

    const totalPages = Math.ceil(userdetail.count / limit);

    res.status(200).json({
      users: userdetail.rows,
      currentPage: page,
      totalUsers: userdetail.count,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({
      message: "Error fetching users",
      error: error.message,
    });
  }
};

const addBook = async (req, res) => {
  try {
    const { name, quantity, department } = req.body;

    if (!name || !quantity) {
      res.status(400).json("Book name and quantity required!!");
    }

    const checkbook = await Book.findOne({ where: { name } });
    if (checkbook) {
      res.status(201).json("Book already exists");
    } else {
      const addBook = await Book.create({ name, quantity, department });
      res.status(201).json({ addBook: "Book added successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const updateBook = async (req, res) => {
  try {
    const { bookId, name, quantity, department } = req.body;
    const bookdetail = await Book.findByPk(bookId);
    if (!bookdetail) {
      res.status(400).json({ message: "No such book available" });
    }
    bookdetail.name = name || bookdetail.name;
    bookdetail.quantity = quantity || bookdetail.quantity;
    bookdetail.department = department || bookdetail.department;
    await bookdetail.save();
    res.status(201).json({ name: "This book is updated successfully!!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const fineOfUser = async (req, res) => {
  try {
    const { UserId } = req.body;
    const issues = await Issue.findAll({
      where: { UserId: UserId, fine: { [Sequelize.Op.gt]: 0 } },
    });
    if (!issues || issues.length === 0) {
      return res.status(404).json({ message: "No books issued to this user." });
    }
    const fineHistory = issues.map((issue) => {
      return {
        bookId: issue.BookId,
        fine: issue.fine,
      };
    });
    return res.status(200).json({ userid: UserId, fineHistory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const countUserAndBook = async (req, res) => {
  try {
    const books = await Book.count();
    const book_count = books || 0;
    const users = await User.count();
    const user_count = users || 0;
    return res.status(200).json({
      books: book_count,
      users: user_count,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  addBook,
  updateBook,
  fineOfUser,
  whiteListUser,
  countUserAndBook,
};
