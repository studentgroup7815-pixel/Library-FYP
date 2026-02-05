import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

import { DollarSign, AlertTriangle, CheckCircle, Filter, RefreshCw, BookX, CreditCard } from 'lucide-react';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showFineModal, setShowFineModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [customFine, setCustomFine] = useState(0);
    const { admin } = useAuth();

    const fetchTransactions = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${admin.token}`,
                },
            };
            const { data } = await axios.get(
                `${import.meta.env.VITE_API_URL}/transactions`,
                config
            );
            setTransactions(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchTransactions, 30000);
        return () => clearInterval(interval);
    }, [admin]);

    const handleAddFine = async () => {
        if (!selectedTransaction || customFine <= 0) return;

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${admin.token}`,
                },
            };
            await axios.post(
                `${import.meta.env.VITE_API_URL}/admin/transactions/${selectedTransaction._id}/fine`,
                { fineAmount: customFine },
                config
            );
            setShowFineModal(false);
            setCustomFine(0);
            setSelectedTransaction(null);
            fetchTransactions();
            alert('Fine added successfully!');
        } catch (error) {
            alert('Failed to add fine');
        }
    };

    const handleMarkReturned = async (transactionId) => {
        if (!window.confirm('Mark this transaction as returned?')) return;

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${admin.token}`,
                },
            };
            await axios.put(
                `${import.meta.env.VITE_API_URL}/admin/transactions/${transactionId}/return`,
                {},
                config
            );
            fetchTransactions();
            alert('Transaction marked as returned!');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update transaction');
        }
    };

    const handleMarkLost = async (transactionId) => {
        if (!window.confirm('Mark this item as lost? This will apply replacement cost + processing fee.')) return;

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${admin.token}`,
                },
            };
            await axios.put(
                `${import.meta.env.VITE_API_URL}/admin/transactions/${transactionId}/lost`,
                {},
                config
            );
            fetchTransactions();
            alert('Item marked as lost!');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to mark as lost');
        }
    };

    const handleMarkPaid = async (transactionId) => {
        if (!window.confirm('Mark this fine as paid via cash/offline method?')) return;

        try {
            const config = {
                headers: { Authorization: `Bearer ${admin.token}` },
            };
            await axios.put(
                `${import.meta.env.VITE_API_URL}/admin/transactions/${transactionId}/pay`,
                { paymentMethod: 'cash' },
                config
            );
            fetchTransactions();
            alert('Fine marked as paid!');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to mark fine as paid');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
    </div>;

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'active') return t.status === 'issued' || t.status === 'overdue';
        if (filter === 'returned') return t.status === 'returned';
        if (filter === 'overdue') {
            return t.status === 'overdue' || (t.status === 'issued' && new Date(t.dueDate) < new Date());
        }
        return true;
    });

    const stats = {
        total: transactions.length,
        active: transactions.filter(t => t.status === 'issued' || t.status === 'overdue').length,
        returned: transactions.filter(t => t.status === 'returned').length,
        overdue: transactions.filter(t => t.status === 'overdue' || (t.status === 'issued' && new Date(t.dueDate) < new Date())).length,
        totalFines: transactions.reduce((sum, t) => sum + (t.currentFine || t.fineAmount || 0), 0)
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Transactions Management</h1>
                    <p className="text-sm text-gray-500">Monitor and manage book rentals</p>
                </div>
                <button
                    onClick={fetchTransactions}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="h-5 w-5" />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="card-dark p-5">
                    <div className="text-sm text-gray-500 mb-2">Total Transactions</div>
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                </div>
                <div className="card-dark p-5">
                    <div className="text-sm text-gray-500 mb-2">Active Rentals</div>
                    <div className="text-2xl font-bold text-yellow-400">{stats.active}</div>
                </div>
                <div className="card-dark p-5">
                    <div className="text-sm text-gray-500 mb-2">Returned</div>
                    <div className="text-2xl font-bold text-green-400">{stats.returned}</div>
                </div>
                <div className="card-dark p-5">
                    <div className="text-sm text-gray-500 mb-2">Overdue</div>
                    <div className="text-2xl font-bold text-red-400">{stats.overdue}</div>
                </div>
                <div className="card-dark p-5">
                    <div className="text-sm text-gray-500 mb-2">Total Fines</div>
                    <div className="text-2xl font-bold text-purple-400">${stats.totalFines.toFixed(2)}</div>
                </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-4 mb-6">
                <Filter className="h-5 w-5 text-gray-400" />
                <div className="flex gap-2">
                    {['all', 'active', 'returned', 'overdue'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Transactions Table */}
            <div className="card-dark overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900/30">
                            <tr className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Book</th>
                                <th className="px-6 py-3">Issue Date</th>
                                <th className="px-6 py-3">Due Date</th>
                                <th className="px-6 py-3">Return Date</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Fine</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/30">
                            {filteredTransactions.map((transaction) => {
                                const isOverdue = transaction.status === 'overdue' || (transaction.status === 'issued' && new Date(transaction.dueDate) < new Date());
                                const isActive = transaction.status === 'issued' || transaction.status === 'overdue';
                                return (
                                    <tr key={transaction._id} className={`hover:bg-gray-800/20 ${isOverdue ? 'bg-red-500/5' : ''}`}>
                                        <td className="px-6 py-4 font-medium text-white">
                                            {transaction.user?.name || 'Unknown User'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {transaction.book?.title || 'Unknown Book'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {new Date(transaction.issueDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={isOverdue ? 'text-red-400 font-semibold' : 'text-gray-400'}>
                                                {new Date(transaction.dueDate).toLocaleDateString()}
                                                {isOverdue && ' ⚠️'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {transaction.returnDate
                                                ? new Date(transaction.returnDate).toLocaleDateString()
                                                : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.status === 'overdue' || isOverdue
                                                    ? 'bg-red-500/10 text-red-400'
                                                    : transaction.status === 'issued'
                                                        ? 'bg-yellow-500/10 text-yellow-400'
                                                        : 'bg-green-500/10 text-green-400'
                                                    }`}
                                            >
                                                {isOverdue ? 'overdue' : transaction.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {(transaction.currentFine || transaction.fineAmount) > 0 ? (
                                                <span className="text-red-400 font-semibold">
                                                    ${(transaction.currentFine || transaction.fineAmount).toFixed(2)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {isActive && (
                                                    <>
                                                        <button
                                                            onClick={() => handleMarkReturned(transaction._id)}
                                                            className="p-1 text-green-400 hover:bg-green-500/10 rounded"
                                                            title="Mark as Returned"
                                                        >
                                                            <CheckCircle className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTransaction(transaction);
                                                                setShowFineModal(true);
                                                            }}
                                                            className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                                                            title="Add Fine"
                                                        >
                                                            <DollarSign className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleMarkLost(transaction._id)}
                                                            className="p-1 text-yellow-400 hover:bg-yellow-500/10 rounded"
                                                            title="Mark as Lost"
                                                        >
                                                            <BookX className="h-5 w-5" />
                                                        </button>
                                                    </>
                                                )}
                                                {transaction.fineAmount > 0 && !transaction.finePaid && (
                                                    <button
                                                        onClick={() => handleMarkPaid(transaction._id)}
                                                        className="p-1 text-purple-400 hover:bg-purple-500/10 rounded"
                                                        title="Mark Fine Paid"
                                                    >
                                                        <CreditCard className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredTransactions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No transactions found
                    </div>
                )}
            </div>

            {/* Fine Modal */}
            {showFineModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="card-dark p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-white mb-4">Add Fine</h3>
                        <div className="mb-4">
                            <p className="text-sm text-gray-400 mb-2">
                                User: <span className="font-semibold text-white">{selectedTransaction?.user?.name}</span>
                            </p>
                            <p className="text-sm text-gray-400 mb-4">
                                Book: <span className="font-semibold text-white">{selectedTransaction?.book?.title}</span>
                            </p>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Fine Amount ($)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={customFine}
                                onChange={(e) => setCustomFine(parseFloat(e.target.value))}
                                className="w-full px-4 py-2 bg-gray-900/30 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowFineModal(false);
                                    setCustomFine(0);
                                    setSelectedTransaction(null);
                                }}
                                className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddFine}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                                Add Fine
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;
