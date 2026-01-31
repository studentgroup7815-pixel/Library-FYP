const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const { calculateUserUnpaidFines } = require('../utils/fineJob');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('rentedBooks')
    .populate('wishlist');

  if (user) {
    // Sync total unpaid fines
    try {
      const currentUnpaid = await calculateUserUnpaidFines(user._id);
      if (user.totalUnpaidFines !== currentUnpaid) {
        user.totalUnpaidFines = currentUnpaid;
        await user.save();
      }
    } catch (error) {
      console.error('Error syncing fines:', error);
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rentedBooks: user.rentedBooks,
      wishlist: user.wishlist,
      fines: user.totalUnpaidFines, // Return the tracked totalUnpaidFines
      isMember: user.isMember,
      membershipDetails: user.membershipDetails,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Submit membership form
// @route   POST /api/users/membership
// @access  Private
const submitMembership = asyncHandler(async (req, res) => {
  const { fullName, cnic, address, phone, city, postalCode, emergencyContact } = req.body;

  const user = await User.findById(req.user._id);

  if (user) {
    user.isMember = true;
    user.membershipDetails = {
      fullName,
      cnic,
      address,
      phone,
      city,
      postalCode,
      emergencyContact,
      membershipDate: new Date(),
    };

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isMember: updatedUser.isMember,
      membershipDetails: updatedUser.membershipDetails,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Check membership status
// @route   GET /api/users/membership/status
// @access  Private
const checkMembershipStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      isMember: user.isMember,
      membershipDetails: user.membershipDetails,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  
  // Optional: Sync fines for all users (might be slow for many users, but ensures consistency)
  const usersWithSyncedFines = await Promise.all(users.map(async (user) => {
    try {
        const currentUnpaid = await calculateUserUnpaidFines(user._id);
        if (user.totalUnpaidFines !== currentUnpaid) {
            user.totalUnpaidFines = currentUnpaid;
            await user.save();
        }
    } catch (error) {
        console.error(`Error syncing fines for user ${user._id}:`, error);
    }
    return user;
  }));

  res.json(usersWithSyncedFines);
});

module.exports = { getUserProfile, getUsers, submitMembership, checkMembershipStatus };
