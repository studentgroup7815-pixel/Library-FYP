const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const libraryConfig = require('../config/libraryConfig');
const { calculateFine, shouldBlockAccount } = require('../utils/fineCalculator');
const { calculateUserUnpaidFines } = require('../utils/fineJob');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = asyncHandler(async (req, res) => {
  // Update overdue status first
  await Transaction.updateMany(
    {
      status: 'issued',
      dueDate: { $lt: new Date() }
    },
    {
      $set: { status: 'overdue' }
    }
  );

  const totalUsers = await User.countDocuments();
  const totalBooks = await Book.countDocuments();
  const totalTransactions = await Transaction.countDocuments();
  const activeRentals = await Transaction.countDocuments({ 
    status: { $in: ['issued', 'overdue'] }
  });
  const overdueRentals = await Transaction.countDocuments({
    status: 'overdue'
  });

  // Calculate total fines
  const fines = await Transaction.aggregate([
    {
      $group: {
        _id: null,
        totalFines: { $sum: '$fineAmount' },
      },
    },
  ]);

  const totalFines = fines[0] ? fines[0].totalFines : 0;

  res.json({
    totalUsers,
    totalBooks,
    totalTransactions,
    activeRentals,
    overdueRentals,
    totalFines,
  });
});

// @desc    Get library configuration
// @route   GET /api/admin/config
// @access  Private/Admin
const getLibraryConfig = asyncHandler(async (req, res) => {
  res.json({
    dailyFineRate: libraryConfig.dailyFineRate,
    maxFinePerItem: libraryConfig.maxFinePerItem,
    gracePeriodDays: libraryConfig.gracePeriodDays,
    lostItemThresholdDays: libraryConfig.lostItemThresholdDays,
    lostItemProcessingFee: libraryConfig.lostItemProcessingFee,
    defaultReplacementCost: libraryConfig.defaultReplacementCost,
    accountBlockThreshold: libraryConfig.accountBlockThreshold,
    defaultRentalDays: libraryConfig.defaultRentalDays,
    maxRentalDays: libraryConfig.maxRentalDays,
    rentalCostPerDay: libraryConfig.rentalCostPerDay,
  });
});

// @desc    Get fine report
// @route   GET /api/admin/fines/report
// @access  Private/Admin
const getFineReport = asyncHandler(async (req, res) => {
  // Get all unpaid fines
  const unpaidFines = await Transaction.find({
    finePaid: { $ne: true },
    fineAmount: { $gt: 0 }
  })
    .populate('user', 'name email accountStatus')
    .populate('book', 'title')
    .sort({ fineAmount: -1 });

  // Get recently paid fines
  const recentlyPaid = await Transaction.find({
    finePaid: true
  })
    .populate('user', 'name email')
    .populate('book', 'title')
    .sort({ finePaymentDate: -1 })
    .limit(20);

  // Calculate summary stats
  const totalUnpaidFines = unpaidFines.reduce((sum, t) => sum + t.fineAmount, 0);
  const totalCollected = await Transaction.aggregate([
    { $match: { finePaid: true } },
    { $group: { _id: null, total: { $sum: '$fineAmount' } } }
  ]);

  // Get users with fines grouped
  const debtorAggregation = await Transaction.aggregate([
    { $match: { finePaid: { $ne: true }, fineAmount: { $gt: 0 } } },
    { $group: { 
      _id: '$user', 
      totalFines: { $sum: '$fineAmount' },
      fineCount: { $sum: 1 }
    }},
    { $sort: { totalFines: -1 } },
    { $limit: 10 }
  ]);

  // Populate user data for debtors
  const topDebtors = await Promise.all(
    debtorAggregation.map(async (debtor) => {
      const user = await User.findById(debtor._id).select('name email accountStatus');
      return {
        user,
        totalFines: debtor.totalFines,
        fineCount: debtor.fineCount
      };
    })
  );

  const usersWithFines = new Set(unpaidFines.map(f => f.user?._id?.toString())).size;

  res.json({
    unpaidFines,
    recentlyPaid,
    topDebtors,
    summary: {
      totalUnpaidFines,
      totalCollected: totalCollected[0]?.total || 0,
      unpaidCount: unpaidFines.length,
      usersWithFines
    }
  });
});

// @desc    Add fine to transaction
// @route   POST /api/admin/transactions/:id/fine
// @access  Private/Admin
const addFine = asyncHandler(async (req, res) => {
  const { fineAmount } = req.body;
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  // Use findByIdAndUpdate to avoid validation issues
  const updatedTransaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    { 
      $inc: { fineAmount: fineAmount },
      status: 'overdue'
    },
    { new: true, runValidators: false }
  );

  // Update user's total unpaid fines
  const user = await User.findById(transaction.user);
  if (user) {
    const totalUnpaid = await calculateUserUnpaidFines(user._id);
    user.totalUnpaidFines = totalUnpaid;
    
    // Check if should block account
    if (shouldBlockAccount(totalUnpaid) && user.accountStatus !== 'blocked') {
      user.accountStatus = 'blocked';
      user.accountBlockReason = `Unpaid fines exceed $${libraryConfig.accountBlockThreshold}`;
      user.accountBlockDate = new Date();
    }
    await user.save();
  }

  res.json(updatedTransaction);
});

// @desc    Mark transaction as returned (admin)
// @route   PUT /api/admin/transactions/:id/return
// @access  Private/Admin
const markAsReturned = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id).populate('book');

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  if (transaction.status === 'returned') {
    res.status(400);
    throw new Error('Transaction already returned');
  }

  transaction.returnDate = Date.now();
  transaction.status = 'returned';

  // Calculate fine using fineCalculator (respects grace period and caps)
  const fineDetails = calculateFine(transaction, transaction.book);
  if (fineDetails.totalFine > 0) {
    transaction.fineAmount = fineDetails.totalFine;
    transaction.fineStartDate = libraryConfig.getGracePeriodEndDate(transaction.dueDate);
  }

  await transaction.save();

  // Update book availability
  const book = await Book.findById(transaction.book._id || transaction.book);
  if (book) {
    book.availableQuantity += 1;
    await book.save();
  }

  // Update user
  const user = await User.findById(transaction.user);
  if (user) {
    user.rentedBooks = user.rentedBooks.filter(
      (id) => id.toString() !== (transaction.book._id || transaction.book).toString()
    );
    
    // Recalculate total unpaid fines
    const totalUnpaid = await calculateUserUnpaidFines(user._id);
    user.totalUnpaidFines = totalUnpaid;
    await user.save();
  }

  res.json(transaction);
});

// @desc    Mark transaction as lost
// @route   PUT /api/admin/transactions/:id/lost
// @access  Private/Admin
const markAsLost = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id).populate('book');

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  if (transaction.isLost) {
    res.status(400);
    throw new Error('Item already marked as lost');
  }

  if (transaction.status === 'returned') {
    res.status(400);
    throw new Error('Cannot mark returned item as lost');
  }

  const replacementCost = transaction.book?.replacementCost || libraryConfig.defaultReplacementCost;

  // Mark as lost with full charges
  transaction.isLost = true;
  transaction.lostDate = new Date();
  transaction.status = 'lost';
  transaction.replacementCost = replacementCost;
  transaction.fineAmount = libraryConfig.maxFinePerItem + replacementCost + libraryConfig.lostItemProcessingFee;

  await transaction.save();

  // Update user's unpaid fines and potentially block account
  const user = await User.findById(transaction.user);
  if (user) {
    const totalUnpaid = await calculateUserUnpaidFines(user._id);
    user.totalUnpaidFines = totalUnpaid;

    if (shouldBlockAccount(totalUnpaid) && user.accountStatus !== 'blocked') {
      user.accountStatus = 'blocked';
      user.accountBlockReason = `Unpaid fines exceed $${libraryConfig.accountBlockThreshold}`;
      user.accountBlockDate = new Date();
    }
    await user.save();
  }

  res.json({
    success: true,
    message: 'Item marked as lost',
    transaction,
    charges: {
      cappedFine: libraryConfig.maxFinePerItem,
      replacementCost: replacementCost,
      processingFee: libraryConfig.lostItemProcessingFee,
      total: transaction.fineAmount
    }
  });
});

// @desc    Waive or reduce a fine
// @route   PUT /api/admin/transactions/:id/waive
// @access  Private/Admin
const waiveFine = asyncHandler(async (req, res) => {
  const { waiveAmount, waiveAll, notes } = req.body;
  const transaction = await Transaction.findById(req.params.id).populate('book');

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  if (transaction.finePaid) {
    res.status(400);
    throw new Error('Fine already paid');
  }

  const originalFine = transaction.fineAmount;
  let amountToWaive = waiveAll ? originalFine : Math.min(waiveAmount, originalFine);

  // Update transaction
  transaction.fineWaivedAmount = (transaction.fineWaivedAmount || 0) + amountToWaive;
  transaction.fineWaivedNotes = notes;
  transaction.fineWaivedBy = req.user._id;
  
  if (waiveAll) {
    transaction.fineAmount = 0;
    transaction.finePaid = true;
    transaction.finePaymentDate = new Date();
    transaction.finePaymentMethod = 'waived';
  } else {
    transaction.fineAmount = originalFine - amountToWaive;
    if (transaction.fineAmount <= 0) {
      transaction.finePaid = true;
      transaction.finePaymentDate = new Date();
      transaction.finePaymentMethod = 'waived';
    }
  }

  await transaction.save();

  // Update user's unpaid fines
  const user = await User.findById(transaction.user);
  if (user) {
    const totalUnpaid = await calculateUserUnpaidFines(user._id);
    user.totalUnpaidFines = totalUnpaid;

    // Unblock if fines below threshold
    if (user.accountStatus === 'blocked' && !shouldBlockAccount(totalUnpaid)) {
      user.accountStatus = 'active';
      user.accountBlockReason = null;
      user.accountBlockDate = null;
    }
    await user.save();
  }

  res.json({
    success: true,
    message: waiveAll ? 'Fine waived completely' : `$${amountToWaive.toFixed(2)} waived from fine`,
    transaction,
    originalFine,
    waived: amountToWaive,
    remaining: transaction.fineAmount
  });
});

// @desc    Unblock user account
// @route   PUT /api/admin/users/:id/unblock
// @access  Private/Admin
const unblockAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.accountStatus !== 'blocked') {
    res.status(400);
    throw new Error('User account is not blocked');
  }

  user.accountStatus = 'active';
  user.accountBlockReason = null;
  user.accountBlockDate = null;
  await user.save();

  res.json({
    success: true,
    message: 'User account unblocked',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      accountStatus: user.accountStatus
    }
  });
});

// @desc    Block user account
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
const blockAccount = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot block admin accounts');
  }

  if (user.accountStatus === 'blocked') {
    res.status(400);
    throw new Error('User account is already blocked');
  }

  user.accountStatus = 'blocked';
  user.accountBlockReason = reason || 'Blocked by admin';
  user.accountBlockDate = new Date();
  await user.save();

  res.json({
    success: true,
    message: 'User account blocked',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      accountStatus: user.accountStatus,
      accountBlockReason: user.accountBlockReason
    }
  });
});

// @desc    Mark a fine as paid
// @route   PUT /api/admin/transactions/:id/pay
// @access  Private/Admin
const markFineAsPaid = asyncHandler(async (req, res) => {
  const { paymentMethod = 'cash' } = req.body;
  const transaction = await Transaction.findById(req.params.id).populate('book');

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  if (transaction.fineAmount <= 0) {
    res.status(400);
    throw new Error('No fine on this transaction');
  }

  if (transaction.finePaid) {
    res.status(400);
    throw new Error('Fine already paid');
  }

  // Mark fine as paid
  transaction.finePaid = true;
  transaction.finePaymentDate = new Date();
  transaction.finePaymentMethod = paymentMethod;
  await transaction.save();

  // Update user's fine history and totals
  const user = await User.findById(transaction.user);
  
  if (user) {
    user.finePaymentHistory.push({
      transactionId: transaction._id,
      amount: transaction.fineAmount,
      paymentDate: new Date(),
      paymentMethod: paymentMethod,
      notes: `Fine paid (Admin: ${req.user.name}) for "${transaction.book ? transaction.book.title : 'Unknown Book'}"`
    });

    // Recalculate total unpaid fines
    const totalUnpaid = await calculateUserUnpaidFines(user._id);
    user.totalUnpaidFines = totalUnpaid;

    // Unblock account if fines are now below threshold
    if (user.accountStatus === 'blocked' && !shouldBlockAccount(user.totalUnpaidFines)) {
      user.accountStatus = 'active';
      user.accountBlockReason = null;
      user.accountBlockDate = null;
    }

    await user.save();
  }

  res.json({
    success: true,
    message: `Fine marked as paid ($${transaction.fineAmount.toFixed(2)})`,
    transaction
  });
});

module.exports = { 
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
};
