const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const connectDB = require('./config/db');

dotenv.config();

const debugUserFines = async () => {
  try {
    await connectDB();

    console.log('--- DEBUG USER FINES ---');

    // Find the 'new user'
    const user = await User.findOne({ name: 'new user' }); // Adjust if name is different, screenshot says 'new user'
    
    if (!user) {
        console.log('User "new user" not found. Listing all users:');
        const users = await User.find({}).select('name totalUnpaidFines');
        console.log(users);
        process.exit();
    }

    console.log(`User: ${user.name} (${user._id})`);
    console.log(`Stored totalUnpaidFines: ${user.totalUnpaidFines}`);
    console.log(`Fine History Length: ${user.finePaymentHistory.length}`);

    // Check transactions
    const transactions = await Transaction.find({ user: user._id });
    console.log(`Total Transactions: ${transactions.length}`);

    console.log('\n--- TRANSACTIONS DUMP ---');
    transactions.forEach(t => {
        console.log(`ID: ${t._id}`);
        console.log(`  Book: ${t.book}`);
        console.log(`  Status: ${t.status}`);
        console.log(`  Fine Amount: ${t.fineAmount}`);
        console.log(`  Fine Paid: ${t.finePaid}`);
        console.log(`  Payment Date: ${t.finePaymentDate}`);
        console.log(`  Payment Method: ${t.finePaymentMethod}`);
        console.log('---');
    });

    const { calculateUserUnpaidFines } = require('./utils/fineJob');
    const calculated = await calculateUserUnpaidFines(user._id);
    console.log(`\nRecalculated Unpaid Fines (Live): ${calculated}`);

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

debugUserFines();
