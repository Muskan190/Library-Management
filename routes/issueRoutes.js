const express = require('express');
const router = express.Router();
const { issueBook, returnBook, getUserIssuedBooks, payFine ,calFine} = require('../controllers/issueController');
const { auth } = require("../middleware/authentication");
router.post('/issueBook',auth, issueBook);

router.post('/returnBook',auth, returnBook);

router.get('/userIssuedBooks/:userId',auth, getUserIssuedBooks);

router.post('/payfine' ,auth, payFine);
router.post('/calfine',auth,calFine);


module.exports = router;
