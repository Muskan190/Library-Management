const express = require("express");
const router = express.Router();
const { signupUser, loginUser } = require("../controllers/userController");
const {
  getAllUsers,
  addBook,
  updateBook,
  fineOfUser,
  whiteListUser,countUserAndBook
} = require("../controllers/adminController");
const {adminAuth}=require("../middleware/authentication");


const {ValidateInput} = require("../middleware/regex");

router.post("/login", loginUser);
router.post("/signUp",ValidateInput, signupUser);
//admin API
router.get("/admin/get-all-users",adminAuth, getAllUsers);
router.post("/admin/add-book", adminAuth, addBook);
router.put("/admin/update-book", adminAuth, updateBook);
router.get("/admin/fine", adminAuth,fineOfUser);
router.put("/admin/whitelist", adminAuth, whiteListUser);
router.get("/admin/count-book-user",adminAuth,countUserAndBook);
module.exports = router;
