import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, BookOpen, Calendar } from 'lucide-react';

const BookDetails = () => {
    const { id } = useParams();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/books/${id}`);
                setBook(data);
                setLoading(false);
            } catch (error) {
                setError('Book not found');
                setLoading(false);
            }
        };

        fetchBook();
    }, [id]);

    const handleRent = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (!user.membershipDetails?.address) {
            alert('Please update your profile with a valid delivery address before ordering.');
            return;
        }

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            await axios.post(
                `${import.meta.env.VITE_API_URL}/transactions/rent`,
                { bookId: id },
                config
            );
            navigate('/dashboard');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to rent book');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Catalog
            </button>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden md:flex">
                <div className="md:w-1/3">
                    <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="p-8 md:w-2/3">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {book.title}
                            </h1>
                            <p className="text-xl text-gray-600 mb-4">{book.author}</p>
                        </div>
                        <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${book.availableQuantity > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}
                        >
                            {book.availableQuantity > 0 ? 'Available' : 'Out of Stock'}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 p-3 rounded-md">
                            <span className="block text-xs text-gray-500 uppercase">Category</span>
                            <span className="font-medium">{book.category}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md">
                            <span className="block text-xs text-gray-500 uppercase">ISBN</span>
                            <span className="font-medium">{book.isbn}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md">
                            <span className="block text-xs text-gray-500 uppercase">
                                Shelf Location
                            </span>
                            <span className="font-medium">{book.shelfLocation || 'N/A'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md">
                            <span className="block text-xs text-gray-500 uppercase">
                                Stock
                            </span>
                            <span className="font-medium">
                                {book.availableQuantity} / {book.totalQuantity}
                            </span>
                        </div>
                    </div>

                    <div className="prose prose-sm text-gray-600 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Description
                        </h3>
                        <p>{book.description || 'No description available.'}</p>
                    </div>

                    <button
                        onClick={handleRent}
                        disabled={book.availableQuantity <= 0}
                        className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${book.availableQuantity > 0
                            ? 'bg-indigo-600 hover:bg-indigo-700'
                            : 'bg-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {book.availableQuantity > 0 ? 'Order for Home Delivery' : 'Currently Unavailable'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookDetails;
