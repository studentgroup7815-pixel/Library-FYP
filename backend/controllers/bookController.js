const asyncHandler = require('express-async-handler');
const Book = require('../models/Book');
const axios = require('axios');

// @desc    Fetch all books
// @route   GET /api/books
// @access  Public
const getBooks = asyncHandler(async (req, res) => {
  const keyword = req.query.keyword
    ? {
        title: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const books = await Book.find({ ...keyword });
  res.json(books);
});

// @desc    Fetch single book
// @route   GET /api/books/:id
// @access  Public
const getBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (book) {
    res.json(book);
  } else {
    res.status(404);
    throw new Error('Book not found');
  }
});

// @desc    Create a book
// @route   POST /api/books
// @access  Private/Admin
const createBook = asyncHandler(async (req, res) => {
  const {
    title,
    author,
    isbn,
    category,
    description,
    coverImage,
    totalQuantity,
    shelfLocation,
  } = req.body;

  const book = new Book({
    title,
    author,
    isbn,
    category,
    description,
    coverImage,
    totalQuantity,
    availableQuantity: totalQuantity,
    shelfLocation,
  });

  const createdBook = await book.save();
  res.status(201).json(createdBook);
});

// @desc    Update a book
// @route   PUT /api/books/:id
// @access  Private/Admin
const updateBook = asyncHandler(async (req, res) => {
  const {
    title,
    author,
    isbn,
    category,
    description,
    coverImage,
    totalQuantity,
    shelfLocation,
  } = req.body;

  const book = await Book.findById(req.params.id);

  if (book) {
    book.title = title || book.title;
    book.author = author || book.author;
    book.isbn = isbn || book.isbn;
    book.category = category || book.category;
    book.description = description || book.description;
    book.coverImage = coverImage || book.coverImage;
    book.totalQuantity = totalQuantity || book.totalQuantity;
    book.shelfLocation = shelfLocation || book.shelfLocation;

    const updatedBook = await book.save();
    res.json(updatedBook);
  } else {
    res.status(404);
    throw new Error('Book not found');
  }
});

// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Private/Admin
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (book) {
    await book.deleteOne();
    res.json({ message: 'Book removed' });
  } else {
    res.status(404);
    throw new Error('Book not found');
  }
});

// @desc    Generate book description using AI
// @route   POST /api/books/generate-ai-description
// @access  Private/Admin
const generateBookDescription = asyncHandler(async (req, res) => {
  const { title, author } = req.body;

  if (!title || !author) {
    res.status(400);
    throw new Error('Title and Author are required');
  }

  try {
    const prompt = `Write a short, engaging description for the book titled "${title}" by ${author}.`;
    
    // Using simple inference API
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/google/flan-t5-large',
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let generatedText = '';
    if (Array.isArray(response.data) && response.data[0]?.generated_text) {
        generatedText = response.data[0].generated_text;
    } else if (response.data?.generated_text) {
        generatedText = response.data.generated_text;
    } else {
        generatedText = 'No description generated.';
    }

    res.json({ description: generatedText });
  } catch (error) {
    console.error('AI Generation Error:', error.response?.data || error.message);
    res.status(503);
    throw new Error('Failed to generate description via AI service');
  }
});

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  generateBookDescription,
};
