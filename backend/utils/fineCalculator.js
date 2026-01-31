const libraryConfig = require('../config/libraryConfig');

/**
 * Fine Calculator Utility
 * Handles all fine-related calculations with grace periods and caps
 */

/**
 * Calculate days between two dates
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {number} Number of days
 */
const daysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end - start;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if transaction is still in grace period
 * @param {Object} transaction 
 * @returns {boolean}
 */
const isInGracePeriod = (transaction) => {
  const now = new Date();
  const dueDate = new Date(transaction.dueDate);
  
  // If not overdue, no grace period needed
  if (now <= dueDate) {
    return false;
  }
  
  // Calculate grace period end
  const gracePeriodEnd = transaction.gracePeriodEndDate 
    ? new Date(transaction.gracePeriodEndDate)
    : libraryConfig.getGracePeriodEndDate(dueDate);
  
  return now <= gracePeriodEnd;
};

/**
 * Calculate days overdue (excluding grace period)
 * @param {Object} transaction 
 * @returns {number} Days overdue beyond grace period
 */
const calculateDaysOverdue = (transaction) => {
  const now = new Date();
  const dueDate = new Date(transaction.dueDate);
  
  // Not overdue
  if (now <= dueDate) {
    return 0;
  }
  
  // Calculate from grace period end
  const gracePeriodEnd = transaction.gracePeriodEndDate 
    ? new Date(transaction.gracePeriodEndDate)
    : libraryConfig.getGracePeriodEndDate(dueDate);
  
  // Still in grace period
  if (now <= gracePeriodEnd) {
    return 0;
  }
  
  return daysBetween(gracePeriodEnd, now);
};

/**
 * Calculate the current fine for a transaction
 * @param {Object} transaction - The transaction object
 * @param {Object} book - Optional book object for lost item replacement cost
 * @returns {Object} Fine details
 */
const calculateFine = (transaction, book = null) => {
  const result = {
    daysOverdue: 0,
    dailyFine: 0,
    totalFine: 0,
    isInGracePeriod: false,
    gracePeriodRemaining: 0,
    isCapped: false,
    isLost: transaction.isLost || false,
    replacementCost: 0,
    processingFee: 0,
    breakdown: []
  };
  
  // If already returned and fine paid, return 0
  if (transaction.status === 'returned' && transaction.finePaid) {
    return result;
  }
  
  const now = new Date();
  const dueDate = new Date(transaction.dueDate);
  
  // Not overdue yet
  if (now <= dueDate) {
    return result;
  }
  
  // Calculate grace period
  const gracePeriodEnd = transaction.gracePeriodEndDate 
    ? new Date(transaction.gracePeriodEndDate)
    : libraryConfig.getGracePeriodEndDate(dueDate);
  
  // Check if in grace period
  if (now <= gracePeriodEnd) {
    result.isInGracePeriod = true;
    result.gracePeriodRemaining = daysBetween(now, gracePeriodEnd);
    return result;
  }
  
  // Calculate overdue days (from grace period end)
  result.daysOverdue = daysBetween(gracePeriodEnd, now);
  
  // Calculate daily fine
  result.dailyFine = result.daysOverdue * libraryConfig.dailyFineRate;
  
  // Apply cap
  if (result.dailyFine > libraryConfig.maxFinePerItem) {
    result.dailyFine = libraryConfig.maxFinePerItem;
    result.isCapped = true;
  }
  
  result.breakdown.push({
    type: 'overdue',
    description: `${result.daysOverdue} days × $${libraryConfig.dailyFineRate.toFixed(2)}/day`,
    amount: result.dailyFine
  });
  
  // Add lost item costs if applicable
  if (transaction.isLost) {
    const bookReplacementCost = book?.replacementCost || 
                                 transaction.replacementCost || 
                                 libraryConfig.defaultReplacementCost;
    
    result.replacementCost = bookReplacementCost;
    result.processingFee = libraryConfig.lostItemProcessingFee;
    
    result.breakdown.push({
      type: 'replacement',
      description: 'Book replacement cost',
      amount: result.replacementCost
    });
    
    result.breakdown.push({
      type: 'processing',
      description: 'Processing fee',
      amount: result.processingFee
    });
  }
  
  // Calculate total
  result.totalFine = result.dailyFine + result.replacementCost + result.processingFee;
  
  return result;
};

/**
 * Check if item should be marked as lost
 * @param {Object} transaction 
 * @returns {boolean}
 */
const shouldMarkAsLost = (transaction) => {
  if (transaction.isLost || transaction.status === 'returned' || transaction.status === 'lost') {
    return false;
  }
  
  const now = new Date();
  const lostThresholdDate = libraryConfig.getLostThresholdDate(transaction.dueDate);
  
  return now > lostThresholdDate;
};

/**
 * Calculate total replacement cost for a lost item
 * @param {Object} book 
 * @param {Object} transaction 
 * @returns {number}
 */
const calculateReplacementCost = (book, transaction) => {
  const bookCost = book?.replacementCost || libraryConfig.defaultReplacementCost;
  const processingFee = libraryConfig.lostItemProcessingFee;
  
  // Include capped fine + replacement + processing
  const cappedFine = libraryConfig.maxFinePerItem;
  
  return bookCost + processingFee + cappedFine;
};

/**
 * Get grace period end date for a transaction
 * @param {Date} dueDate 
 * @returns {Date}
 */
const getGracePeriodEndDate = (dueDate) => {
  return libraryConfig.getGracePeriodEndDate(dueDate);
};

/**
 * Check if user should be blocked based on fines
 * @param {number} totalUnpaidFines 
 * @returns {boolean}
 */
const shouldBlockAccount = (totalUnpaidFines) => {
  return totalUnpaidFines >= libraryConfig.accountBlockThreshold;
};

module.exports = {
  calculateFine,
  calculateDaysOverdue,
  isInGracePeriod,
  shouldMarkAsLost,
  calculateReplacementCost,
  getGracePeriodEndDate,
  shouldBlockAccount,
  daysBetween
};
