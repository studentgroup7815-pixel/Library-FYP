const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Book = require('../models/Book');
const libraryConfig = require('../config/libraryConfig');
const { calculateFine, shouldBlockAccount } = require('../utils/fineCalculator');
const { calculateUserUnpaidFines } = require('../utils/fineJob');

// @desc    Get user's fines
// @route   GET /api/fines
// @access  Private
const getUserFines = asyncHandler(async (req, res) => {
  // Get all transactions with fines
  const transactions = await Transaction.find({
    user: req.user._id,
    $or: [
      { fineAmount: { $gt: 0 } },
      { status: 'overdue' },
      { isLost: true }
    ]
  }).populate('book', 'title author coverImage replacementCost');

  // Calculate current fines for each transaction
  const finesWithDetails = await Promise.all(
    transactions.map(async (transaction) => {
      const fineDetails = calculateFine(transaction, transaction.book);
      
      return {
        _id: transaction._id,
        book: transaction.book,
        issueDate: transaction.issueDate,
        dueDate: transaction.dueDate,
        returnDate: transaction.returnDate,
        gracePeriodEndDate: transaction.gracePeriodEndDate,
        status: transaction.status,
        isLost: transaction.isLost,
        lostDate: transaction.lostDate,
        fineAmount: transaction.finePaid ? transaction.fineAmount : fineDetails.totalFine,
        finePaid: transaction.finePaid,
        finePaymentDate: transaction.finePaymentDate,
        fineDetails: fineDetails,
        currentlyAccruing: !transaction.finePaid && 
                          !transaction.returnDate && 
                          fineDetails.daysOverdue > 0
      };
    })
  );

  // Separate paid and unpaid fines
  const unpaidFines = finesWithDetails.filter(f => !f.finePaid && f.fineAmount > 0);
  const paidFines = finesWithDetails.filter(f => f.finePaid);
  const totalUnpaid = unpaidFines.reduce((sum, f) => sum + f.fineAmount, 0);

  res.json({
    unpaidFines,
    paidFines,
    totalUnpaid,
    accountBlocked: shouldBlockAccount(totalUnpaid),
    blockThreshold: libraryConfig.accountBlockThreshold
  });
});

// @desc    Pay a specific fine
// @route   POST /api/fines/:id/pay
// @access  Private
const payFine = asyncHandler(async (req, res) => {
  const { paymentMethod = 'online' } = req.body;
  
  const transaction = await Transaction.findById(req.params.id).populate('book');

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  if (transaction.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to pay this fine');
  }

  if (transaction.finePaid) {
    res.status(400);
    throw new Error('Fine already paid');
  }

  // Calculate final fine amount
  const fineDetails = calculateFine(transaction, transaction.book);
  const finalFineAmount = fineDetails.totalFine;

  if (finalFineAmount <= 0) {
    res.status(400);
    throw new Error('No fine to pay');
  }

  // Update transaction
  transaction.fineAmount = finalFineAmount;
  transaction.finePaid = true;
  transaction.finePaymentDate = new Date();
  transaction.finePaymentMethod = paymentMethod || 'online';
  await transaction.save();

  // Update user's fine history and totals
  const user = await User.findById(req.user._id);
  
  user.finePaymentHistory.push({
    transactionId: transaction._id,
    amount: finalFineAmount,
    paymentDate: new Date(),
    paymentMethod: paymentMethod,
    notes: `Fine paid for "${transaction.book.title}"`
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

  res.json({
    success: true,
    message: `Fine of $${finalFineAmount.toFixed(2)} paid successfully`,
    transaction: {
      _id: transaction._id,
      fineAmount: transaction.fineAmount,
      finePaid: transaction.finePaid,
      finePaymentDate: transaction.finePaymentDate
    },
    newTotalUnpaid: user.totalUnpaidFines,
    accountStatus: user.accountStatus
  });
});

// @desc    Pay all outstanding fines
// @route   POST /api/fines/pay-all
// @access  Private
const payAllFines = asyncHandler(async (req, res) => {
  const { paymentMethod = 'online' } = req.body;

  // Get all unpaid fines
  const transactions = await Transaction.find({
    user: req.user._id,
    finePaid: { $ne: true },
    fineAmount: { $gt: 0 }
  }).populate('book');

  if (transactions.length === 0) {
    res.status(400);
    throw new Error('No unpaid fines to pay');
  }

  let totalPaid = 0;
  const paidTransactions = [];

  for (const transaction of transactions) {
    // Calculate final fine
    const fineDetails = calculateFine(transaction, transaction.book);
    const finalFineAmount = fineDetails.totalFine > 0 ? fineDetails.totalFine : transaction.fineAmount;

    if (finalFineAmount > 0) {
      transaction.fineAmount = finalFineAmount;
      transaction.finePaid = true;
      transaction.finePaymentDate = new Date();
      transaction.finePaymentMethod = paymentMethod;
      await transaction.save();

      totalPaid += finalFineAmount;
      paidTransactions.push({
        transactionId: transaction._id,
        book: transaction.book.title,
        amount: finalFineAmount
      });
    }
  }

  // Update user
  const user = await User.findById(req.user._id);

  for (const paid of paidTransactions) {
    user.finePaymentHistory.push({
      transactionId: paid.transactionId,
      amount: paid.amount,
      paymentDate: new Date(),
      paymentMethod: paymentMethod,
      notes: `Bulk fine payment for "${paid.book}"`
    });
  }

  user.totalUnpaidFines = 0;

  // Unblock account
  if (user.accountStatus === 'blocked') {
    user.accountStatus = 'active';
    user.accountBlockReason = null;
    user.accountBlockDate = null;
  }

  await user.save();

  res.json({
    success: true,
    message: `Total of $${totalPaid.toFixed(2)} paid for ${paidTransactions.length} fines`,
    paidTransactions,
    totalPaid,
    accountStatus: user.accountStatus
  });
});

// @desc    Get fine payment history
// @route   GET /api/fines/history
// @access  Private
const getFineHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('finePaymentHistory.transactionId');

  res.json({
    history: user.finePaymentHistory.sort((a, b) => b.paymentDate - a.paymentDate),
    totalPaid: user.finePaymentHistory.reduce((sum, p) => sum + p.amount, 0)
  });
});

// @desc    Get fine summary for user
// @route   GET /api/fines/summary
// @access  Private
const getFineSummary = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const totalUnpaid = await calculateUserUnpaidFines(user._id);

  // Update stored value if different
  if (user.totalUnpaidFines !== totalUnpaid) {
    user.totalUnpaidFines = totalUnpaid;
    await user.save();
  }

  // Count overdue items
  const overdueCount = await Transaction.countDocuments({
    user: req.user._id,
    status: 'overdue'
  });

  // Count lost items
  const lostCount = await Transaction.countDocuments({
    user: req.user._id,
    isLost: true,
    finePaid: { $ne: true }
  });

  res.json({
    totalUnpaidFines: user.totalUnpaidFines,
    overdueItems: overdueCount,
    lostItems: lostCount,
    isBlocked: user.accountStatus === 'blocked',
    accountBlockReason: user.accountBlockReason,
    dailyFineRate: libraryConfig.dailyFineRate,
    gracePeriodDays: libraryConfig.gracePeriodDays,
    maxFinePerItem: libraryConfig.maxFinePerItem,
    blockThreshold: libraryConfig.accountBlockThreshold
  });
});

// @desc    Get fine configuration
// @route   GET /api/fines/config
// @access  Private
const getFineConfig = asyncHandler(async (req, res) => {
  res.json({
    dailyFineRate: libraryConfig.dailyFineRate,
    gracePeriodDays: libraryConfig.gracePeriodDays,
    maxFinePerItem: libraryConfig.maxFinePerItem,
    lostItemProcessingFee: libraryConfig.lostItemProcessingFee,
    accountBlockThreshold: libraryConfig.accountBlockThreshold
  });
});

module.exports = {
  getUserFines,
  payFine,
  payAllFines,
  getFineHistory,
  getFineSummary,
  getFineConfig
};
