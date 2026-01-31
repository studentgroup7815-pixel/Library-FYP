// Library Configuration - Centralized fine and policy settings
const libraryConfig = {
  // Fine rates
  dailyFineRate: 0.50,           // Fine per day in dollars
  maxFinePerItem: 25.00,         // Maximum fine cap per item
  
  // Grace period
  gracePeriodDays: 3,            // Days before fines start accumulating
  
  // Lost item settings
  lostItemThresholdDays: 45,     // Days until item is marked as lost
  lostItemProcessingFee: 15.00,  // Admin processing fee for lost items
  defaultReplacementCost: 25.00, // Default book replacement cost
  
  // Account blocking
  accountBlockThreshold: 50.00,  // Fine amount that triggers account block
  
  // Rental settings
  defaultRentalDays: 14,         // Default rental period
  maxRentalDays: 30,             // Maximum rental period
  rentalCostPerDay: 2.00,        // Rental cost per day
  
  // Notifications (for future use)
  reminderDaysBeforeDue: [3, 1], // Days before due to send reminders
  
  // Get calculated values
  getGracePeriodEndDate: function(dueDate) {
    const date = new Date(dueDate);
    date.setDate(date.getDate() + this.gracePeriodDays);
    return date;
  },
  
  getLostThresholdDate: function(dueDate) {
    const date = new Date(dueDate);
    date.setDate(date.getDate() + this.lostItemThresholdDays);
    return date;
  }
};

module.exports = libraryConfig;
