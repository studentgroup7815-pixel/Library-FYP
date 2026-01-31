const express = require('express');
const router = express.Router();
const {
  getUserFines,
  payFine,
  payAllFines,
  getFineHistory,
  getFineSummary,
  getFineConfig
} = require('../controllers/fineController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Get user's fines
router.get('/', getUserFines);

// Get fine configuration
router.get('/config', getFineConfig);

// Get fine summary
router.get('/summary', getFineSummary);

// Get fine payment history
router.get('/history', getFineHistory);

// Pay specific fine
router.post('/:id/pay', payFine);

// Pay all fines
router.post('/pay-all', payAllFines);

module.exports = router;
