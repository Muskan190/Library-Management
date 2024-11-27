const { sequelize, Book, User, Issue } = require("../models/index");
const getBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const offset = (page - 1) * limit;
    const { rows: books, count: totalbooks } = await Book.findAndCountAll({
      limit,
      offset,
    });
    const totalPages = Math.ceil(totalbooks / limit);
    res.status(200).json({
      books,
      currentPage: page,
      totalbooks,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching books",
      error: error.message,
    });
  }
};
const rankBooks = async (req, res) => {
  try {
    const ranking = await Book.findAll({
      attributes: [
        "id",
        "name",
        "quantity",
        "department",
        [
          sequelize.literal(
            `RANK() OVER(PARTITION BY department ORDER BY (SELECT COUNT(Issues.BookId) from Issues WHERE Issues.BookId=Book.id) DESC)`
          ),
          "departmentRank",
        ],
      ],
      include: [
        {
          model: Issue,
          attributes: [],
        },
      ],
    });
    if (ranking) res.status(200).json(ranking);
    else res.status(404).json("Not Found!!");
  } catch (error) {
    res.status(500).json({error:error.message});
  }
};
module.exports = { getBooks, rankBooks };
