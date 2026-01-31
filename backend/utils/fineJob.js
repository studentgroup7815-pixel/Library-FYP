const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Book = require('../models/Book');
const libraryConfig = require('../config/libraryConfig');
const { calculateFine, shouldMarkAsLost, shouldBlockAccount } = require('./fineCalculator');

/**
 * Fine Job Utilities
 * Background job functions for managing fines
 */

/**
 * Update status and fines for all overdue transactions
 * Should be run periodically (e.g., daily via cron job)
 */
const updateAllOverdueFines = async () => {
  const results = {
    processed: 0,
    updated: 0,
    errors: []
  };

  try {
    // Find all active transactions
    const transactions = await Transaction.find({
      status: { $in: ['issued', 'overdue'] },
      returnDate: { $exists: false }
    }).populate('book');

    for (const transaction of transactions) {
      try {
        const now = new Date();
        const dueDate = new Date(transaction.dueDate);
        
        // Calculate current fine
        const fineDetails = calculateFine(transaction, transaction.book);
        
        // Update transaction
        const updates = {};
        
        // Update status if overdue and past grace period
        if (now > dueDate && !fineDetails.isInGracePeriod && transaction.status !== 'overdue') {
          updates.status = 'overdue';
        }
        
        // Update fine start date if just started accumulating
        if (fineDetails.daysOverdue > 0 && !transaction.fineStartDate) {
          updates.fineStartDate = libraryConfig.getGracePeriodEndDate(dueDate);
        }
        
        // Update fine amount
        if (fineDetails.totalFine !== transaction.fineAmount) {
          updates.fineAmount = fineDetails.totalFine;
        }
        
        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          await Transaction.findByIdAndUpdate(transaction._id, updates);
          results.updated++;
        }
        
        results.processed++;
      } catch (error) {
        results.errors.push({
          transactionId: transaction._id,
          error: error.message
        });
      }
    }
  } catch (error) {
    results.errors.push({
      type: 'general',
      error: error.message
    });
  }

  return results;
};

/**
 * Mark items as lost if past threshold
 * Should be run periodically (e.g., daily via cron job)
 */
const markLostItems = async () => {
  const results = {
    processed: 0,
    markedLost: 0,
    errors: []
  };

  try {
    const transactions = await Transaction.find({
      status: { $in: ['issued', 'overdue'] },
      isLost: { $ne: true },
      returnDate: { $exists: false }
    }).populate('book');

    for (const transaction of transactions) {
      try {
        if (shouldMarkAsLost(transaction)) {
          const replacementCost = transaction.book?.replacementCost || 
                                   libraryConfig.defaultReplacementCost;
          
          await Transaction.findByIdAndUpdate(transaction._id, {
            isLost: true,
            lostDate: new Date(),
            status: 'lost',
            replacementCost: replacementCost,
            // Set fine to cap + replacement + processing
            fineAmount: libraryConfig.maxFinePerItem + 
                       replacementCost + 
                       libraryConfig.lostItemProcessingFee
          });

          // Update user's unpaid fines
          const user = await User.findById(transaction.user);
          if (user) {
            const totalUnpaid = await calculateUserUnpaidFines(user._id);
            await User.findByIdAndUpdate(user._id, {
              totalUnpaidFines: totalUnpaid
            });
          }

          results.markedLost++;
        }
        results.processed++;
      } catch (error) {
        results.errors.push({
          transactionId: transaction._id,
          error: error.message
        });
      }
    }
  } catch (error) {
    results.errors.push({
      type: 'general',
      error: error.message
    });
  }

  return results;
};

/**
 * Block accounts that have exceeded fine threshold
 * Should be run periodically
 */
const blockAccountsWithHighFines = async () => {
  const results = {
    processed: 0,
    blocked: 0,
    errors: []
  };

  try {
    const users = await User.find({
      accountStatus: 'active',
      role: 'user'
    });

    for (const user of users) {
      try {
        const totalUnpaid = await calculateUserUnpaidFines(user._id);
        
        // Update user's total unpaid fines
        await User.findByIdAndUpdate(user._id, {
          totalUnpaidFines: totalUnpaid
        });

        if (shouldBlockAccount(totalUnpaid)) {
          await User.findByIdAndUpdate(user._id, {
            accountStatus: 'blocked',
            accountBlockReason: `Unpaid fines exceed $${libraryConfig.accountBlockThreshold}`,
            accountBlockDate: new Date()
          });
          results.blocked++;
        }
        
        results.processed++;
      } catch (error) {
        results.errors.push({
          userId: user._id,
          error: error.message
        });
      }
    }
  } catch (error) {
    results.errors.push({
      type: 'general',
      error: error.message
    });
  }

  return results;
};

/**
 * Calculate total unpaid fines for a user
 * @param {string} userId 
 * @returns {number}
 */
const calculateUserUnpaidFines = async (userId) => {
  const transactions = await Transaction.find({
    user: userId,
    finePaid: { $ne: true },
    fineAmount: { $gt: 0 }
  }).populate('book');

  let total = 0;
  for (const transaction of transactions) {
    // Calculate current fine (may be more than stored if still accumulating)
    if (transaction.status === 'returned' || transaction.status === 'lost') {
      total += transaction.fineAmount;
    } else {
      const fineDetails = calculateFine(transaction, transaction.book);
      total += fineDetails.totalFine;
    }
  }

  return total;
};

/**
 * Run all fine maintenance jobs
 */
const runAllFineJobs = async () => {
  console.log('Running fine maintenance jobs...');
  
  const overdueResults = await updateAllOverdueFines();
  console.log('Overdue fines update:', overdueResults);
  
  const lostResults = await markLostItems();
  console.log('Lost items marked:', lostResults);
  
  const blockResults = await blockAccountsWithHighFines();
  console.log('Account blocking:', blockResults);
  
  return {
    overdue: overdueResults,
    lost: lostResults,
    blocked: blockResults
  };
};

module.exports = {
  updateAllOverdueFines,
  markLostItems,
  blockAccountsWithHighFines,
  calculateUserUnpaidFines,
  runAllFineJobs
};
