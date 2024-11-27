const { Op } = require("sequelize");
const { sequelize, Book, User, Issue } = require("../models/index.js");
const { calculateFine } = require("../utils/fineCalculator.js");
const FinePayment = require("../models/finePaymentModel");
const client = require("../redisClient.js");
const issueBook = async (req, res) => {
  const { userId, bookModelId } = req.body;
  try {
    // Fetch user and book in parallel
    const [user, book] = await Promise.all([
      User.findByPk(userId),
      Book.findByPk(bookModelId),
    ]);

    // Validate user and book existence
    if (!user || !book) {
      return res.status(400).json({ message: "User or Book not found" });
    }

    // Check if user has exceeded the maximum issued books limit
    const [issuedBooksCount, fineAppliedBook, alreadyIssued] =
      await Promise.all([
        Issue.count({ where: { UserId: user.id, returnTime: null } }),
        Issue.findOne({
          where: { UserId: user.id, fine: { [Op.gt]: 0 }, returnTime: null },
        }),
        Issue.findOne({
          where: { UserId: user.id, BookId: book.id, returnTime: null },
        }),
      ]);

    if (issuedBooksCount >= 2) {
      return res.status(400).json({
        message: "User has already issued the maximum number of books",
      });
    }

    if (fineAppliedBook) {
      return res.status(400).json({
        message: "User cannot issue another book with fine applied",
      });
    }

    if (alreadyIssued) {
      return res
        .status(400)
        .json({ message: "User has already issued this book" });
    }

    // Check book availability
    if (book.quantity <= 0) {
      return res.status(400).json({ message: "Book is out of stock" });
    }

    // Create the issue record and decrement book quantity
    const issue = await Issue.create({
      UserId: user.id,
      BookId: book.id,
      userName: user.name,
      issueTime: new Date(),
    });
    await book.decrement("quantity");

    // Fetch updated issued books details with associations
    const issuedBooksDetails = await Issue.findAll({
      where: { UserId: user.id },
      include: [
        { model: Book, attributes: ["name"] },
        { model: User, attributes: ["name"] },
      ],
    });

    // Cache issued books details in Redis
    await client.set(
      `user:${userId}`,
      JSON.stringify(issuedBooksDetails),
      "EX",
      3600 // Expiration time in seconds
    );

    res.status(200).json({
      message: "Book issued successfully",
      issuedBooksDetails,
    });
  } catch (error) {
    console.error("Error in issueBook:", error);
    res
      .status(500)
      .json({ message: "Error issuing book", error: error.message });
  }
};

const returnBook = async (req, res) => {
  const { issueId } = req.body;

  if (!issueId) {
    return res.status(400).json({ message: "Issue ID is required" });
  }

  try {
    // Fetch the issue record with associated user and book details
    const issue = await Issue.findByPk(issueId, {
      include: [
        { model: User, attributes: ["id", "name"] },
        { model: Book, attributes: ["id", "name"] },
      ],
    });

    // Validate the issue record and associated details
    if (!issue) {
      return res.status(404).json({ message: "Issue record not found" });
    }

    if (!issue.Book) {
      return res
        .status(400)
        .json({ message: "Book details are missing in the issue record" });
    }

    if (issue.returnTime) {
      return res
        .status(400)
        .json({ message: "Book has already been returned" });
    }
    // Calculate and update fine
    const fine = await calculateFine(issue.issueTime, new Date());
    await issue.update({ fine: fine });

    if (fine > 0 && !issue.finePaid) {
      return res.status(400).json({
        message:
          "Outstanding fine detected. Please clear the fine before returning the book.",
        fine,
      });
    }

    // Update book quantity
    const book = issue.Book; // Book already fetched in `issue`
    await book.increment("quantity");

    // Update issue record and clean up if necessary
    // await issue.update({ returnTime: new Date(), fine: 0 });
    await issue.destroy({ where: issueId }); // Removes the issue record

    // Update cache
    const cacheKey = `user:${issue.UserId}`;
    const activeIssues = await Issue.findAll({
      where: { UserId: issue.UserId, returnTime: null },
      include: [
        { model: User, attributes: ["name"] },
        { model: Book, attributes: ["name"] },
      ],
    });

    if (activeIssues.length > 0) {
      await client.set(cacheKey, JSON.stringify(activeIssues), "EX", 3600); // Update cache
    } else {
      await client.del(cacheKey); // Clear cache if no active issues
    }

    // Respond with success message
    res.status(200).json({
      message: "Book returned successfully",
      issue,
    });
  } catch (error) {
    console.error("Error in returnBook:", error);
    res.status(500).json({
      message: "Error returning the book",
      error: error.message,
    });
  }
};

const getUserIssuedBooks = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const cacheKey = `user:${userId}`;

    // Check Redis cache first
    const cachedResult = await client.get(cacheKey);
    if (cachedResult) {
      console.log("Response from Redis cache");
      return res.status(200).json({ issues: JSON.parse(cachedResult) });
    }

    // Fetch issued books from the database
    const issues = await Issue.findAll({
      where: { UserId: userId, returnTime: null },
      include: [
        { model: User, attributes: ["name"] },
        { model: Book, attributes: ["name"] },
      ],
    });

    // If no issued books are found
    if (issues.length === 0) {
      return res
        .status(404)
        .json({ message: "No issued books found for this user" });
    }

    // Cache the result in Redis for future requests
    await client.set(cacheKey, JSON.stringify(issues), "EX", 3600); // Cache with 1-hour expiry

    // Return the fetched result
    res.status(200).json({ issues });
  } catch (error) {
    console.error("Error fetching issued books:", error);
    res
      .status(500)
      .json({ message: "Error fetching issued books", error: error.message });
  }
};

const payFine = async (req, res) => {
  const { issueId } = req.body;

  if (!issueId) {
    return res.status(400).json({ message: "Issue ID is required" });
  }

  try {
    const issue = await Issue.findByPk(issueId);

    if (!issue) {
      return res.status(400).json({ message: "Issue record not found" });
    }

    if (issue.fine === 0) {
      return res
        .status(400)
        .json({ message: "No fine to be paid for this issue" });
    }

    if (issue.finePaid) {
      return res.status(400).json({ message: "Fine has already been paid" });
    }

    const finecalc = await calculateFine(issue.issueTime, new Date());

    await issue.update({ fine: finecalc });

    const finePayment = await FinePayment.create({
      IssueId: issueId,
      amountPaid: issue.fine,
    });

    await issue.update({ finePaid: true });

    res.status(200).json({
      message: "Fine paid successfully",
      paymentRecord: finePayment,
    });
  } catch (error) {
    console.error("Error in payFine:", error);
    res
      .status(500)
      .json({ message: "Error paying fine", error: error.message });
  }
};
const calFine = async (req, res) => {
  const { issueId } = req.body;
  if (!issueId) {
    return res.status(400).json({ message: "Issue ID is required" });
  }
  try {
    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(400).json({ message: "Issue record not found" });
    }
    const calc = await calculateFine(issue.issueTime, new Date());
    await issue.update({ fine: calc });
    res.status(200).json({ message: "Fine updated Successfully", fine: calc });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
module.exports = {
  issueBook,
  returnBook,
  getUserIssuedBooks,
  payFine,
  calFine,
};
