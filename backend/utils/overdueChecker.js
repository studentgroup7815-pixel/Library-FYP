const Transaction = require('../models/Transaction');

const OVERDUE_FINE = 5; // $5 per overdue book

const checkOverdueTransactions = async () => {
  try {
    const now = new Date();

    // Find all active transactions that are past due date and don't have overdue status yet
    const overdueTransactions = await Transaction.find({
      status: 'issued',
      dueDate: { $lt: now },
    });

    if (overdueTransactions.length > 0) {
      console.log(`Found ${overdueTransactions.length} overdue transactions. Adding fines...`);

      for (const transaction of overdueTransactions) {
        // Add $5 fine if not already added
        if (transaction.fineAmount === 0) {
          transaction.fineAmount = OVERDUE_FINE;
        }
        transaction.status = 'overdue';
        await transaction.save();
      }

      console.log(`Successfully processed ${overdueTransactions.length} overdue transactions.`);
    }
  } catch (error) {
    console.error('Error checking overdue transactions:', error);
  }
};

// Run immediately on start, then every hour
const startOverdueChecker = () => {
  console.log('Overdue checker initialized. Checking every hour...');
  checkOverdueTransactions(); // Run immediately
  setInterval(checkOverdueTransactions, 60 * 60 * 1000); // Run every hour
};

module.exports = { checkOverdueTransactions, startOverdueChecker };
