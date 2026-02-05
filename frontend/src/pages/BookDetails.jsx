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
        <div className="max-w-5xl mx-auto px-4 py-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors group"
            >
                <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Catalog
            </button>

            <div className="card-dark overflow-hidden flex flex-col md:flex-row shadow-2xl ring-1 ring-white/10">
                <div className="md:w-2/5 relative min-h-[400px]">
                    <img
                        src={book.coverImage}
                        alt={book.title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#16161d] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#16161d]"></div>
                </div>

                <div className="p-8 md:w-3/5 bg-[#16161d]">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2 leading-tight">
                                {book.title}
                            </h1>
                            <p className="text-xl text-purple-400 font-medium">{book.author}</p>
                        </div>
                        <span
                            className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase ${book.availableQuantity > 0
                                ? 'bg-green-500/10 text-green-400 ring-1 ring-green-500/50'
                                : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/50'
                                }`}
                        >
                            {book.availableQuantity > 0 ? 'Available' : 'Out of Stock'}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-[#1f1f2e] p-4 rounded-xl border border-white/5">
                            <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Category</span>
                            <span className="font-semibold text-gray-200">{book.category}</span>
                        </div>
                        <div className="bg-[#1f1f2e] p-4 rounded-xl border border-white/5">
                            <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">ISBN</span>
                            <span className="font-semibold text-gray-200">{book.isbn}</span>
                        </div>
                        <div className="bg-[#1f1f2e] p-4 rounded-xl border border-white/5">
                            <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                                Shelf Location
                            </span>
                            <span className="font-semibold text-gray-200">{book.shelfLocation || 'N/A'}</span>
                        </div>
                        <div className="bg-[#1f1f2e] p-4 rounded-xl border border-white/5">
                            <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                                Stock
                            </span>
                            <span className="font-semibold text-gray-200">
                                {book.availableQuantity} <span className="text-gray-500">/ {book.totalQuantity}</span>
                            </span>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                            Description
                        </h3>
                        <p className="text-gray-400 leading-relaxed text-lg font-light">
                            {book.description || 'No description available for this title.'}
                        </p>
                    </div>

                    <button
                        onClick={handleRent}
                        disabled={book.availableQuantity <= 0}
                        className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ${book.availableQuantity > 0
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
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
