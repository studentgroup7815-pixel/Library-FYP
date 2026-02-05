const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  generateBookDescription,
} = require('../controllers/bookController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(getBooks).post(protect, admin, createBook);
router.post('/generate-ai-description', protect, admin, generateBookDescription);
router
  .route('/:id')
  .get(getBookById)
  .put(protect, admin, updateBook)
  .delete(protect, admin, deleteBook);

module.exports = router;
