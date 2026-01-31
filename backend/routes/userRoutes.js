const express = require('express');
const router = express.Router();
const { getUserProfile, getUsers, submitMembership, checkMembershipStatus } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/profile', protect, getUserProfile);
router.post('/membership', protect, submitMembership);
router.get('/membership/status', protect, checkMembershipStatus);
router.get('/', protect, admin, getUsers);

module.exports = router;
