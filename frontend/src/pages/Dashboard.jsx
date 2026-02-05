import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Clock, Book, AlertTriangle, DollarSign, Calendar, TrendingUp, CreditCard, X } from 'lucide-react';

const Dashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showFineModal, setShowFineModal] = useState(false);
    const [selectedRental, setSelectedRental] = useState(null);
    const [calculatedFine, setCalculatedFine] = useState(0);
    const [processingReturn, setProcessingReturn] = useState(false);
    const [fineConfig, setFineConfig] = useState(null);
    const { user } = useAuth();

    const fetchData = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const [transactionsRes, statsRes, configRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/transactions/my`, config),
                axios.get(`${import.meta.env.VITE_API_URL}/users/profile`, config),
                axios.get(`${import.meta.env.VITE_API_URL}/fines/config`, config)
            ]);
            setTransactions(transactionsRes.data);
            setUserStats(statsRes.data);
            setFineConfig(configRes.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);



    const handleReturnClick = (rental) => {
        const fine = rental.currentFine || 0;

        if (fine > 0) {
            // Has fines - show payment modal
            setSelectedRental(rental);
            setCalculatedFine(fine);
            setShowFineModal(true);
        } else {
            // No fines - return directly
            handleReturn(rental.book._id);
        }
    };

    const handleReturn = async (bookId) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            await axios.post(
                `${import.meta.env.VITE_API_URL}/transactions/return`,
                { bookId },
                config
            );
            alert('Book returned successfully!');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to return book');
        }
    };

    const handlePayAndReturn = async () => {
        if (!selectedRental) return;

        setProcessingReturn(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            // Return the book (fine will be calculated on backend)
            await axios.post(
                `${import.meta.env.VITE_API_URL}/transactions/return`,
                { bookId: selectedRental.book._id },
                config
            );

            // Now pay the fine for this transaction
            const transactionsRes = await axios.get(`${import.meta.env.VITE_API_URL}/transactions/my`, config);
            const returnedTransaction = transactionsRes.data.find(
                t => t.book._id === selectedRental.book._id && t.status === 'returned' && t.fineAmount > 0 && !t.finePaid
            );

            if (returnedTransaction) {
                try {
                    await axios.post(
                        `${import.meta.env.VITE_API_URL}/fines/${returnedTransaction._id}/pay`,
                        { paymentMethod: 'online' },
                        config
                    );
                    alert('Book returned and fine paid successfully!');
                } catch (payError) {
                    alert('Book returned! Fine payment failed - please pay from the Fines page.');
                }
            } else {
                alert('Book returned successfully!');
            }

            setShowFineModal(false);
            setSelectedRental(null);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to process return');
        } finally {
            setProcessingReturn(false);
        }
    };

    const handleReturnOnly = async () => {
        if (!selectedRental) return;

        setProcessingReturn(true);
        try {
            await handleReturn(selectedRental.book._id);
            setShowFineModal(false);
            setSelectedRental(null);
        } catch (error) {
            // Error handled in handleReturn
        } finally {
            setProcessingReturn(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64">
        <div className="text-gray-400 animate-pulse">Loading...</div>
    </div>;

    const activeRentals = transactions.filter((t) => t.status === 'issued' || t.status === 'overdue');
    const overdueRentals = transactions.filter((t) => {
        return t.status === 'overdue' || (t.status === 'issued' && new Date(t.dueDate) < new Date());
    });
    // Include lost items in history
    const history = transactions.filter((t) => t.status === 'returned' || t.status === 'lost');
    const totalFines = transactions.reduce((sum, t) => sum + (t.fineAmount || 0), 0);

    return (
        <div>
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
                    <p className="text-sm text-gray-500">Welcome back, {userStats?.name || user?.name}</p>
                </div>
                {userStats?.isMember && (
                    <div className="bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-lg">
                        <span className="text-purple-400 text-xs font-medium">✓ Active Member</span>
                    </div>
                )}
            </div>

            {!userStats?.isMember && (
                <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-yellow-400 font-medium text-sm mb-1">Membership Required</p>
                            <p className="text-yellow-300 text-xs mb-3">
                                You need to complete your membership registration to rent books. Visit the Books page and click on any "Rent" button to get started.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="card-dark p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Active Rentals</span>
                        <Book className="h-4 w-4 text-purple-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{activeRentals.length}</p>
                    <p className="text-xs text-gray-600 mt-1">Currently borrowed</p>
                </div>
                <div className="card-dark p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Total Borrowed</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{transactions.length}</p>
                    <p className="text-xs text-gray-600 mt-1">All time</p>
                </div>
                <div className="card-dark p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Overdue</span>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{overdueRentals.length}</p>
                    <p className="text-xs text-gray-600 mt-1">Return soon</p>
                </div>
                <div className="card-dark p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Unpaid Fines</span>
                        <DollarSign className="h-4 w-4 text-yellow-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">${(userStats?.fines || 0).toFixed(2)}</p>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-600">
                            Lifetime: ${totalFines.toFixed(2)}
                        </p>
                        {userStats?.fines > 0 && (
                            <Link to="/fines" className="text-xs text-yellow-500 hover:text-yellow-400 font-medium flex items-center">
                                Pay Now →
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Active Rentals */}
            <div className="card-dark mb-6">
                <div className="px-5 py-4 border-b border-gray-800/50 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Active Rentals</h2>
                    <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">{activeRentals.length} books</span>
                </div>
                <div className="p-5">
                    {activeRentals.length === 0 ? (
                        <div className="text-center py-12">
                            <Book className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-500">No active rentals</p>
                            <p className="text-sm text-gray-600 mt-1">Browse books to start borrowing</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeRentals.map((rental) => {
                                const isOverdue = new Date(rental.dueDate) < new Date();
                                const fine = rental.currentFine || 0;
                                const hasFine = fine > 0;
                                return (
                                    <div
                                        key={rental._id}
                                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${isOverdue ? 'bg-red-950/20 border-red-900/50' : 'bg-gray-900/30 border-gray-800/50 hover:border-gray-700'
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-white">
                                                {rental.book.title}
                                            </h4>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {rental.book.author}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-xs">
                                                <div className="flex items-center text-gray-600">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    <span>{new Date(rental.issueDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className={`flex items-center ${isOverdue ? 'text-red-500' : 'text-gray-600'}`}>
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    <span>Due: {new Date(rental.dueDate).toLocaleDateString()}</span>
                                                    {isOverdue && <span className="ml-1 text-red-500">• Overdue!</span>}
                                                </div>
                                                <div className="flex items-center text-yellow-500">
                                                    <DollarSign className="h-3 w-3 mr-1" />
                                                    <span>Fine: ${fine.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleReturnClick(rental)}
                                            className={`ml-4 px-5 py-2 text-white text-sm font-medium rounded-lg transition-colors ${hasFine
                                                ? 'bg-yellow-600 hover:bg-yellow-700'
                                                : 'bg-purple-600 hover:bg-purple-700'
                                                }`}
                                        >
                                            {hasFine ? 'Return & Pay' : 'Return'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Rental History */}
            <div className="card-dark">
                <div className="px-5 py-4 border-b border-gray-800/50">
                    <h2 className="text-lg font-semibold text-white">Rental History</h2>
                </div>
                <div className="overflow-x-auto">
                    {history.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No rental history yet
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-900/30">
                                <tr className="text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="px-5 py-3 font-medium">Book</th>
                                    <th className="px-5 py-3 font-medium">Author</th>
                                    <th className="px-5 py-3 font-medium">Issued</th>
                                    <th className="px-5 py-3 font-medium">Due</th>
                                    <th className="px-5 py-3 font-medium">Returned/Lost</th>
                                    <th className="px-5 py-3 font-medium">Fine</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/30">
                                {history.map((rental) => (
                                    <tr key={rental._id} className="hover:bg-gray-900/20 transition-colors">
                                        <td className="px-5 py-4 font-medium text-white">
                                            {rental.book.title}
                                        </td>
                                        <td className="px-5 py-4 text-gray-400">
                                            {rental.book.author}
                                        </td>
                                        <td className="px-5 py-4 text-gray-500">
                                            {new Date(rental.issueDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-5 py-4 text-gray-500">
                                            {new Date(rental.dueDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-5 py-4 text-gray-500">
                                            {rental.status === 'lost'
                                                ? <span className="text-red-400">{new Date(rental.lostDate || rental.updatedAt).toLocaleDateString()}</span>
                                                : (rental.returnDate ? new Date(rental.returnDate).toLocaleDateString() : '-')
                                            }
                                        </td>
                                        <td className="px-5 py-4">
                                            {rental.fineAmount > 0 ? (
                                                <span className={rental.finePaid ? 'text-green-400' : 'text-red-400 font-semibold'}>
                                                    ${rental.fineAmount.toFixed(2)}
                                                    {rental.finePaid && ' ✓'}
                                                </span>
                                            ) : (
                                                <span className="text-gray-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${rental.status === 'returned'
                                                ? 'bg-green-500/10 text-green-500'
                                                : rental.status === 'lost'
                                                    ? 'bg-red-500/10 text-red-500'
                                                    : 'bg-yellow-500/10 text-yellow-500'
                                                }`}>
                                                {rental.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Fine Payment Modal */}
            {showFineModal && selectedRental && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="card-dark p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Return Book with Fine</h3>
                            <button
                                onClick={() => {
                                    setShowFineModal(false);
                                    setSelectedRental(null);
                                }}
                                className="p-1 text-gray-400 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="bg-gray-900/50 p-4 rounded-lg mb-4">
                                <p className="text-sm text-gray-400 mb-1">Book</p>
                                <p className="font-semibold text-white">{selectedRental.book.title}</p>
                                <p className="text-sm text-gray-500">{selectedRental.book.author}</p>
                            </div>

                            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-red-400 mb-1">Outstanding Fine</p>
                                        <p className="text-2xl font-bold text-red-400">${calculatedFine.toFixed(2)}</p>
                                    </div>
                                    <DollarSign className="h-10 w-10 text-red-400/50" />
                                </div>
                                <p className="text-xs text-red-300 mt-2">
                                    This fine is for returning the book after the due date (plus 3-day grace period).
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handlePayAndReturn}
                                disabled={processingReturn}
                                className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <CreditCard className="h-5 w-5" />
                                {processingReturn ? 'Processing...' : `Pay $${calculatedFine.toFixed(2)} & Return`}
                            </button>
                            <button
                                onClick={handleReturnOnly}
                                disabled={processingReturn}
                                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                Return Now, Pay Later
                            </button>
                            <p className="text-xs text-gray-500 text-center">
                                Note: Unpaid fines may block future rentals
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
