const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const connectDB = require('./config/db');

dotenv.config();

const fixData = async () => {
  try {
    await connectDB();

    console.log('--- FIXING DATA ---');

    // 1. Fix User Fines Field (Sync fines -> totalUnpaidFines)
    // Actually, meaningless since we updated controller to use totalUnpaidFines. 
    // But good for consistency.
    const users = await User.find({});
    for (const user of users) {
        if (user.fines !== user.totalUnpaidFines) {
            console.log(`Syncing user ${user.name}: fines ${user.fines} -> ${user.totalUnpaidFines}`);
            user.fines = user.totalUnpaidFines;
            await user.save();
        }
    }

    // 2. Fix Transaction Metadata for 'new user' (the one with unknown payment)
    const transaction = await Transaction.findOne({ 
        finePaid: true, 
        finePaymentMethod: { $exists: false } 
    });

    if (transaction) {
        console.log(`Fixing transaction ${transaction._id} metadata...`);
        transaction.finePaymentMethod = 'online';
        transaction.finePaymentDate = new Date(); // Set to now
        await transaction.save();
        console.log('Fixed.');
    } else {
        console.log('No broken transactions found.');
    }

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

fixData();
