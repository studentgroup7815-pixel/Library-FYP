const mongoose = require('mongoose');
const dotenv = require('dotenv');
const users = require('./data/users');
const books = require('./data/books');
const User = require('./models/User');
const Book = require('./models/Book');
const Transaction = require('./models/Transaction');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const importData = async () => {
  try {
    await Transaction.deleteMany();
    await Book.deleteMany();
    await User.deleteMany();

    const createdUsers = await User.create(users);

    // Make the first user an admin if not already (though our sample data handles this)
    // const adminUser = createdUsers[0]._id;

    const sampleBooks = books.map((book) => {
      return { ...book, availableQuantity: book.totalQuantity };
    });

    await Book.insertMany(sampleBooks);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Transaction.deleteMany();
    await Book.deleteMany();
    await User.deleteMany();

    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
