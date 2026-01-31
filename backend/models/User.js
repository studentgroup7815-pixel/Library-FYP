const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    membershipStatus: {
      type: String,
      enum: ['active', 'inactive', 'banned'],
      default: 'active',
    },
    isMember: {
      type: Boolean,
      default: false,
    },
    membershipDetails: {
      fullName: String,
      cnic: String,
      address: String,
      phone: String,
      city: String,
      postalCode: String,
      emergencyContact: String,
      membershipDate: Date,
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
      },
    ],
    rentedBooks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
      },
    ],
    fines: {
      type: Number,
      default: 0,
    },
    // Account status for fine blocking
    accountStatus: {
      type: String,
      enum: ['active', 'blocked', 'suspended'],
      default: 'active',
    },
    accountBlockReason: {
      type: String,
    },
    accountBlockDate: {
      type: Date,
    },
    totalUnpaidFines: {
      type: Number,
      default: 0,
    },
    finePaymentHistory: [{
      transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
      },
      amount: Number,
      paymentDate: Date,
      paymentMethod: String,
      notes: String,
    }],
  },
  {
    timestamps: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
