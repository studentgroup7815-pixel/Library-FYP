const express = require('express');
const router = express.Router();
const {
  rentBook,
  returnBook,
  getMyTransactions,
  getAllTransactions,
  processPayment,
} = require('../controllers/transactionController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/rent', protect, rentBook);
router.post('/:id/pay', protect, processPayment);
router.post('/return', protect, returnBook);
router.get('/my', protect, getMyTransactions);
router.get('/', protect, admin, getAllTransactions);

module.exports = router;
