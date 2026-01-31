const mongoose = require('mongoose');

const bookSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    isbn: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    coverImage: {
      type: String,
      default: 'https://via.placeholder.com/150',
    },
    totalQuantity: {
      type: Number,
      required: true,
      default: 1,
    },
    availableQuantity: {
      type: Number,
      required: true,
      default: 1,
    },
    shelfLocation: {
      type: String,
    },
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    // Cost to replace if lost
    replacementCost: {
      type: Number,
      default: 25.00,
    },
  },
  {
    timestamps: true,
  }
);

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
