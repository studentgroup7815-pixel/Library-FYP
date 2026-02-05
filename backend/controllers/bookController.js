const asyncHandler = require('express-async-handler');
const Book = require('../models/Book');
const { HfInference } = require('@huggingface/inference');

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

  if (!process.env.HUGGINGFACE_API_KEY) {
      console.error('HUGGINGFACE_API_KEY is missing in backend environment variables');
      res.status(500);
      throw new Error('Server configuration error: API Key missing');
  }

  try {
    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    const prompt = `Write a short, engaging description for the book titled "${title}" by ${author}.`;
    
    // Using Qwen/Qwen2.5-7B-Instruct as requested by user
    const response = await hf.chatCompletion({
      model: 'Qwen/Qwen2.5-7B-Instruct',
      messages: [
        { role: "system", content: "You are a helpful librarian assistant. Write short, engaging book descriptions." },
        { role: "user", content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const generatedText = response.choices[0].message.content || 'No description generated.';

    // Clean up if necessary
    const finalDescription = generatedText.trim();

    res.json({ description: finalDescription });
  } catch (error) {
    console.error('AI Generation Error:', JSON.stringify(error, null, 2));
    if (error.message?.includes('loading')) {
        res.status(503);
        throw new Error('Model is currently loading. Please try again in 30 seconds.');
    }
    res.status(500); 
    throw new Error(`AI Service Error: ${error.message || 'Unknown error'}`);
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
