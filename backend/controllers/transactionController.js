const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const User = require('../models/User');
const libraryConfig = require('../config/libraryConfig');
const { calculateFine } = require('../utils/fineCalculator');

// @desc    Rent a book
// @route   POST /api/transactions/rent
// @access  Private
const rentBook = asyncHandler(async (req, res) => {
  const { bookId, rentalDuration } = req.body;

  // Check if user is a member
  const user = await User.findById(req.user._id);
  if (!user.isMember) {
    res.status(403);
    throw new Error('You must be a member to rent books');
  }

  // Check if account is blocked
  if (user.accountStatus === 'blocked') {
    res.status(403);
    throw new Error('Your account is blocked due to unpaid fines. Please pay your fines before renting new books.');
  }

  // Check if user has unpaid fines
  const unpaidFines = await Transaction.find({
    user: req.user._id,
    fineAmount: { $gt: 0 },
    $or: [
      { status: 'issued' },
      { status: 'overdue' },
      { status: 'returned', fineAmount: { $gt: 0 } }
    ]
  });

  if (unpaidFines.length > 0) {
    const totalFines = unpaidFines.reduce((sum, t) => sum + t.fineAmount, 0);
    res.status(403);
    throw new Error(`You have unpaid fines totaling $${totalFines.toFixed(2)}. Please pay your fines before renting new books.`);
  }

  const book = await Book.findById(bookId);

  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  if (book.availableQuantity <= 0) {
    res.status(400);
    throw new Error('Book not available');
  }

  // Check if user already has this book rented
  const activeTransaction = await Transaction.findOne({
    user: req.user._id,
    book: bookId,
    status: 'issued',
  });

  if (activeTransaction) {
    res.status(400);
    throw new Error('You already have this book rented');
  }

  // Calculate rental cost (e.g., $2 per day)
  const rentalCost = rentalDuration * 2;

  const transaction = await Transaction.create({
    user: req.user._id,
    book: bookId,
    dueDate: new Date(Date.now() + rentalDuration * 24 * 60 * 60 * 1000),
    rentalDuration,
    rentalCost,
    deliveryAddress: user.membershipDetails.address,
    paymentStatus: 'pending',
  });

  if (transaction) {
    book.availableQuantity -= 1;
    await book.save();

    user.rentedBooks.push(bookId);
    await user.save();

    res.status(201).json(transaction);
  } else {
    res.status(400);
    throw new Error('Invalid transaction data');
  }
});

// @desc    Process payment for rental
// @route   POST /api/transactions/:id/pay
// @access  Private
const processPayment = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id).populate('book');

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  if (transaction.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (transaction.paymentStatus === 'paid') {
    res.status(400);
    throw new Error('Payment already completed');
  }

  transaction.paymentStatus = 'paid';
  await transaction.save();

  res.json({
    success: true,
    message: `Payment successful! Your book "${transaction.book.title}" will be delivered to your address within 3 business days. Please return it before ${transaction.dueDate.toLocaleDateString()} to the nearest library branch.`,
    transaction,
  });
});

// @desc    Return a book
// @route   POST /api/transactions/return
// @access  Private
const returnBook = asyncHandler(async (req, res) => {
  const { bookId } = req.body;

  const transaction = await Transaction.findOne({
    user: req.user._id,
    book: bookId,
    status: { $in: ['issued', 'overdue'] },
  });

  if (!transaction) {
    res.status(404);
    throw new Error('No active rental found for this book');
  }

  transaction.returnDate = Date.now();
  transaction.status = 'returned';

  // Calculate fine using fineCalculator (respects grace period and caps)
  const bookForFine = await Book.findById(bookId);
  const fineDetails = calculateFine(transaction, bookForFine);
  if (fineDetails.totalFine > 0) {
    transaction.fineAmount = fineDetails.totalFine;
    transaction.fineStartDate = libraryConfig.getGracePeriodEndDate(transaction.dueDate);
  }

  await transaction.save();

  const book = await Book.findById(bookId);
  book.availableQuantity += 1;
  await book.save();

  const user = await User.findById(req.user._id);
  user.rentedBooks = user.rentedBooks.filter(
    (id) => id.toString() !== bookId.toString()
  );
  if (transaction.fineAmount > 0) {
    user.fines += transaction.fineAmount;
  }
  await user.save();

  res.json(transaction);
});

// @desc    Get user transactions
// @route   GET /api/transactions/my
// @access  Private
const getMyTransactions = asyncHandler(async (req, res) => {
  // Update overdue status
  await Transaction.updateMany(
    {
      status: 'issued',
      dueDate: { $lt: new Date() }
    },
    {
      $set: { status: 'overdue' }
    }
  );

  const transactions = await Transaction.find({ user: req.user._id }).populate(
    'book',
    'title author'
  ).lean(); // Use lean() to allow adding properties

  // Calculate current fines for active transactions
  const enrichedTransactions = transactions.map(transaction => {
    if (transaction.status === 'issued' || transaction.status === 'overdue') {
      const fineDetails = calculateFine(transaction, transaction.book);
      return {
        ...transaction,
        currentFine: fineDetails.totalFine,
        daysOverdue: fineDetails.daysOverdue
      };
    }
    return {
      ...transaction,
      currentFine: transaction.finePaid ? 0 : transaction.fineAmount 
    };
  });

  res.json(enrichedTransactions);
});

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private/Admin
const getAllTransactions = asyncHandler(async (req, res) => {
  // Update overdue status
  await Transaction.updateMany(
    {
      status: 'issued',
      dueDate: { $lt: new Date() }
    },
    {
      $set: { status: 'overdue' }
    }
  );

  const transactions = await Transaction.find({})
    .populate('user', 'name email')
    .populate('book', 'title')
    .lean(); // Use lean() to allow adding properties

  // Calculate current fines for active transactions
  const enrichedTransactions = transactions.map(transaction => {
    if (transaction.status === 'issued' || transaction.status === 'overdue') {
      const fineDetails = calculateFine(transaction, transaction.book);
      return {
        ...transaction,
        currentFine: fineDetails.totalFine,
        daysOverdue: fineDetails.daysOverdue
      };
    }
    return {
      ...transaction,
      currentFine: transaction.finePaid ? 0 : transaction.fineAmount 
    };
  });

  res.json(enrichedTransactions);
});

module.exports = {
  rentBook,
  returnBook,
  getMyTransactions,
  getAllTransactions,
  processPayment,
};
