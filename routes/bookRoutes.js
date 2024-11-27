const express = require("express");
const router = express.Router();
const {
  getBooks,rankBooks
} = require("../controllers/bookController");


router.get("/", getBooks);
router.get("/rank-book",rankBooks);



module.exports = router;
