const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
    },
    rentalDuration: {
      type: Number,
      required: false,
      default: 0,
    },
    rentalCost: {
      type: Number,
      required: false,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    deliveryAddress: {
      type: String,
    },
    status: {
      type: String,
      enum: ['issued', 'returned', 'overdue', 'lost'],
      default: 'issued',
    },
    fineAmount: {
      type: Number,
      default: 0,
    },
    // Fine tracking fields
    finePaid: {
      type: Boolean,
      default: false,
    },
    finePaymentDate: {
      type: Date,
    },
    finePaymentMethod: {
      type: String,
      enum: ['online', 'cash', 'card', 'waived'],
    },
    fineStartDate: {
      type: Date,
    },
    gracePeriodEndDate: {
      type: Date,
    },
    // Lost item fields
    isLost: {
      type: Boolean,
      default: false,
    },
    lostDate: {
      type: Date,
    },
    replacementCost: {
      type: Number,
    },
    // Fine waiver fields (admin)
    fineWaivedAmount: {
      type: Number,
      default: 0,
    },
    fineWaivedNotes: {
      type: String,
    },
    fineWaivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
