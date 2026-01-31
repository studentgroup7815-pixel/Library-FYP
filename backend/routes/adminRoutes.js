const express = require('express');
const router = express.Router();
const { 
  getStats, 
  addFine, 
  markAsReturned,
  markAsLost,
  waiveFine,
  unblockAccount,
  blockAccount,
  getFineReport,
  getLibraryConfig,
  markFineAsPaid
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All admin routes require authentication and admin role
router.use(protect, admin);

// Dashboard stats
router.get('/stats', getStats);

// Library configuration
router.get('/config', getLibraryConfig);

// Transaction management
router.post('/transactions/:id/fine', addFine);
router.put('/transactions/:id/return', markAsReturned);
router.put('/transactions/:id/lost', markAsLost);
router.put('/transactions/:id/waive', waiveFine);

// User management
router.put('/users/:id/unblock', unblockAccount);
router.put('/users/:id/block', blockAccount);

// Fine reports
router.get('/fines/report', getFineReport);
router.put('/transactions/:id/pay', markFineAsPaid);

module.exports = router;
