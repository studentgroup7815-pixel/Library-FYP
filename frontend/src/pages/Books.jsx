import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, BookOpen, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MembershipModal from '../components/MembershipModal';
import RentalModal from '../components/RentalModal';

const Books = () => {
    const [books, setBooks] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(true);
    const [isMember, setIsMember] = useState(false);
    const [showMembershipModal, setShowMembershipModal] = useState(false);
    const [showRentalModal, setShowRentalModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [unpaidFines, setUnpaidFines] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const { data } = await axios.get(
                    `${import.meta.env.VITE_API_URL}/books?keyword=${keyword}`
                );
                setBooks(data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };

        fetchBooks();
    }, [keyword]);

    useEffect(() => {
        const checkMembership = async () => {
            if (user) {
                try {
                    const config = {
                        headers: {
                            Authorization: `Bearer ${user.token}`,
                        },
                    };
                    const { data } = await axios.get(
                        `${import.meta.env.VITE_API_URL}/users/membership/status`,
                        config
                    );
                    setIsMember(data.isMember);
                } catch (error) {
                    console.error(error);
                }
            }
        };

        const checkUnpaidFines = async () => {
            if (user) {
                try {
                    const config = {
                        headers: {
                            Authorization: `Bearer ${user.token}`,
                        },
                    };
                    const { data } = await axios.get(
                        `${import.meta.env.VITE_API_URL}/transactions/my-transactions`,
                        config
                    );
                    const finesTotal = data
                        .filter(t => t.fineAmount > 0)
                        .reduce((sum, t) => sum + t.fineAmount, 0);
                    setUnpaidFines(finesTotal);
                } catch (error) {
                    console.error(error);
                }
            }
        };

        checkMembership();
        checkUnpaidFines();
    }, [user]);

    const handleBorrow = (book) => {
        if (!isMember) {
            setShowMembershipModal(true);
        } else if (unpaidFines > 0) {
            alert(`You have unpaid fines totaling $${unpaidFines.toFixed(2)}. Please pay your fines in the Dashboard before renting new books.`);
        } else {
            setSelectedBook(book);
            setShowRentalModal(true);
        }
    };

    const handleMembershipSuccess = () => {
        setIsMember(true);
    };

    const handleRentalSuccess = async () => {
        // Refresh books
        const { data } = await axios.get(
            `${import.meta.env.VITE_API_URL}/books?keyword=${keyword}`
        );
        setBooks(data);
    };

    return (
        <div>
            {unpaidFines > 0 && (
                <div className="mb-6 card-dark border-red-500/50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-red-400 mb-1">Unpaid Fines</h3>
                            <p className="text-sm text-gray-400">
                                You have ${unpaidFines.toFixed(2)} in unpaid fines. Please pay them in your Dashboard to continue renting books.
                            </p>
                        </div>
                        <Link
                            to="/dashboard"
                            className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
                        >
                            Pay Now
                        </Link>
                    </div>
                </div>
            )}

            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-2xl font-bold text-white">Browse Books</h1>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Search by title, author, or ISBN..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[#16161d] border border-gray-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="text-gray-500 animate-pulse">Loading...</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {books.map((book) => (
                        <div
                            key={book._id}
                            className="card-dark overflow-hidden hover:border-gray-700 transition-colors group"
                        >
                            <div className="h-56 bg-[#0d0d12] relative overflow-hidden">
                                <img
                                    src={book.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop'}
                                    alt={book.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {book.availableQuantity <= 0 && (
                                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                        <span className="text-gray-400 font-medium text-sm">Not Available</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-white mb-1 line-clamp-2 text-base">
                                    {book.title}
                                </h3>
                                <p className="text-sm text-gray-400 mb-3">{book.author}</p>
                                <div className="flex items-center justify-between text-sm mb-3">
                                    <span className="text-gray-500">Available: <span className="font-medium text-white">{book.availableQuantity}</span></span>
                                    <span className="text-gray-600">Total: {book.totalQuantity}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        to={`/books/${book._id}`}
                                        className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg text-center text-sm font-medium hover:bg-gray-700 transition-colors"
                                    >
                                        Details
                                    </Link>
                                    <button
                                        onClick={() => handleBorrow(book)}
                                        disabled={book.availableQuantity <= 0}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${book.availableQuantity > 0
                                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                            }`}
                                    >
                                        <BookOpen className="h-3 w-3" />
                                        Rent
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && books.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-sm">No books found. Try a different search term.</p>
                </div>
            )}

            <MembershipModal
                isOpen={showMembershipModal}
                onClose={() => setShowMembershipModal(false)}
                onSuccess={handleMembershipSuccess}
            />

            <RentalModal
                isOpen={showRentalModal}
                onClose={() => setShowRentalModal(false)}
                book={selectedBook}
                onSuccess={handleRentalSuccess}
            />
        </div>
    );
};

export default Books;
