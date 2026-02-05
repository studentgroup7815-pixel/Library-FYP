import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Books = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        category: '',
        totalQuantity: 1,
        coverImage: '',
        shelfLocation: '',
        description: '',
    });
    const { admin } = useAuth();

    const fetchBooks = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/books`);
            setBooks(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${admin.token}`,
                },
            };
            if (editingBook) {
                await axios.put(`${import.meta.env.VITE_API_URL}/books/${editingBook._id}`, formData, config);
                alert('Book updated successfully!');
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/books`, formData, config);
                alert('Book added successfully!');
            }
            setShowModal(false);
            setEditingBook(null);
            setFormData({
                title: '',
                author: '',
                isbn: '',
                category: '',
                totalQuantity: 1,
                coverImage: '',
                shelfLocation: '',
                description: '',
            });
            fetchBooks();
        } catch (error) {
            alert('Failed to save book');
        }
    };

    const handleEdit = (book) => {
        setEditingBook(book);
        setFormData({
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            category: book.category,
            totalQuantity: book.totalQuantity,
            coverImage: book.coverImage || '',
            shelfLocation: book.shelfLocation || '',
            description: book.description || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this book?')) {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${admin.token}`,
                    },
                };
                await axios.delete(`${import.meta.env.VITE_API_URL}/books/${id}`, config);
                fetchBooks();
            } catch (error) {
                alert('Failed to delete book');
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Books Management</h1>
                    <p className="text-sm text-gray-500">Manage library inventory</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Book
                </button>
            </div>

            <div className="card-dark overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-900/30">
                        <tr className="text-gray-500 text-xs uppercase">
                            <th className="px-5 py-3 font-medium">Title</th>
                            <th className="px-5 py-3 font-medium">Author</th>
                            <th className="px-5 py-3 font-medium">ISBN</th>
                            <th className="px-5 py-3 font-medium">Category</th>
                            <th className="px-5 py-3 font-medium">Stock</th>
                            <th className="px-5 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/30">
                        {books.map((book) => (
                            <tr key={book._id} className="hover:bg-gray-800/20 transition-colors">
                                <td className="px-5 py-4 font-medium text-white">
                                    {book.title}
                                </td>
                                <td className="px-5 py-4 text-gray-400">{book.author}</td>
                                <td className="px-5 py-4 text-gray-400">{book.isbn}</td>
                                <td className="px-5 py-4">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400">
                                        {book.category}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-gray-400">
                                    <span className="text-white font-medium">{book.availableQuantity}</span> / {book.totalQuantity}
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(book)}
                                            className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                                            title="Edit book"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(book._id)}
                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Delete book"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="card-dark max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-6 text-white">
                            {editingBook ? 'Edit Book' : 'Add New Book'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 bg-[#0d0d12] border border-gray-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
                                        value={formData.title}
                                        onChange={(e) =>
                                            setFormData({ ...formData, title: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Author
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 bg-[#0d0d12] border border-gray-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
                                        value={formData.author}
                                        onChange={(e) =>
                                            setFormData({ ...formData, author: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        ISBN
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 bg-[#0d0d12] border border-gray-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
                                        value={formData.isbn}
                                        onChange={(e) =>
                                            setFormData({ ...formData, isbn: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Category
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 bg-[#0d0d12] border border-gray-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
                                        value={formData.category}
                                        onChange={(e) =>
                                            setFormData({ ...formData, category: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Total Quantity
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        className="w-full px-4 py-2.5 bg-[#0d0d12] border border-gray-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
                                        value={formData.totalQuantity}
                                        onChange={(e) =>
                                            setFormData({ ...formData, totalQuantity: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Shelf Location
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-[#0d0d12] border border-gray-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
                                        value={formData.shelfLocation}
                                        onChange={(e) =>
                                            setFormData({ ...formData, shelfLocation: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Cover Image URL
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-[#0d0d12] border border-gray-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
                                    value={formData.coverImage}
                                    onChange={(e) =>
                                        setFormData({ ...formData, coverImage: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Description
                                </label>
                                <textarea
                                    className="w-full px-4 py-2.5 bg-[#0d0d12] border border-gray-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                                >
                                    Save Book
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Books;
