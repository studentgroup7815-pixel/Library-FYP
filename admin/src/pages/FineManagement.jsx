import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    DollarSign,
    AlertTriangle,
    CheckCircle,
    Filter,
    BookX,
    Clock,
    Ban,
    Unlock,
    FileText,
    Settings,
    Users,
    TrendingUp
} from 'lucide-react';

const FineManagement = () => {
    const [fineReport, setFineReport] = useState(null);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('unpaid');
    const [showWaiveModal, setShowWaiveModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [waiveAmount, setWaiveAmount] = useState(0);
    const [waiveAll, setWaiveAll] = useState(false);
    const [waiveNotes, setWaiveNotes] = useState('');
    const { admin } = useAuth();

    const fetchData = async () => {
        try {
            const headerConfig = {
                headers: {
                    Authorization: `Bearer ${admin.token}`,
                },
            };

            const [reportRes, configRes] = await Promise.all([
                axios.get('http://localhost:5000/api/admin/fines/report', headerConfig),
                axios.get('http://localhost:5000/api/admin/config', headerConfig)
            ]);

            setFineReport(reportRes.data);
            setConfig(configRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching fine data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [admin]);

    const handleWaiveFine = async () => {
        if (!selectedTransaction) return;

        try {
            const headerConfig = {
                headers: {
                    Authorization: `Bearer ${admin.token}`,
                },
            };

            await axios.put(
                `http://localhost:5000/api/admin/transactions/${selectedTransaction._id}/waive`,
                {
                    waiveAmount: waiveAll ? 0 : waiveAmount,
                    waiveAll,
                    notes: waiveNotes
                },
                headerConfig
            );

            setShowWaiveModal(false);
            setSelectedTransaction(null);
            setWaiveAmount(0);
            setWaiveAll(false);
            setWaiveNotes('');
            fetchData();
            alert('Fine waived successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to waive fine');
        }
    };

    const handleUnblockUser = async (userId) => {
        if (!window.confirm('Unblock this user account?')) return;

        try {
            const headerConfig = {
                headers: {
                    Authorization: `Bearer ${admin.token}`,
                },
            };

            await axios.put(
                `http://localhost:5000/api/admin/users/${userId}/unblock`,
                {},
                headerConfig
            );

            fetchData();
            alert('User account unblocked!');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to unblock user');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-400 animate-pulse">Loading fine data...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">Fine Management</h1>
                <p className="text-sm text-gray-500">Monitor and manage library fines</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="card-dark p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Unpaid Fines</span>
                        <DollarSign className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="text-3xl font-bold text-red-400">
                        ${fineReport?.summary?.totalUnpaidFines?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        {fineReport?.summary?.unpaidCount || 0} transactions
                    </p>
                </div>

                <div className="card-dark p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Collected</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-green-400">
                        ${fineReport?.summary?.totalCollected?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Total paid fines</p>
                </div>

                <div className="card-dark p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Users with Fines</span>
                        <Users className="h-4 w-4 text-yellow-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {fineReport?.summary?.usersWithFines || 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Active debtors</p>
                </div>

                <div className="card-dark p-5 bg-blue-500/5 border-blue-500/20">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Fine Rate</span>
                        <Settings className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-xl font-bold text-white">
                        ${config?.dailyFineRate?.toFixed(2)}/day
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        Cap: ${config?.maxFinePerItem?.toFixed(2)} | Grace: {config?.gracePeriodDays}d
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('unpaid')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'unpaid'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                >
                    Unpaid Fines
                </button>
                <button
                    onClick={() => setActiveTab('debtors')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'debtors'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                >
                    Top Debtors
                </button>
                <button
                    onClick={() => setActiveTab('recent')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'recent'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                >
                    Recently Paid
                </button>
            </div>

            {/* Unpaid Fines Tab */}
            {activeTab === 'unpaid' && (
                <div className="card-dark overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-800/50">
                        <h2 className="text-lg font-semibold text-white">Unpaid Fines</h2>
                    </div>
                    <div className="overflow-x-auto">
                        {!fineReport?.unpaidFines?.length ? (
                            <div className="text-center py-12">
                                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                                <p className="text-gray-400">No unpaid fines!</p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-900/30">
                                    <tr className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                        <th className="px-6 py-3">User</th>
                                        <th className="px-6 py-3">Book</th>
                                        <th className="px-6 py-3">Due Date</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Fine</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/30">
                                    {fineReport.unpaidFines.map((fine) => (
                                        <tr key={fine._id} className="hover:bg-gray-800/20">
                                            <td className="px-6 py-4 font-medium text-white">
                                                {fine.user?.name || 'Unknown'}
                                                <br />
                                                <span className="text-xs text-gray-500">{fine.user?.email}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400">
                                                {fine.book?.title || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-400">
                                                {new Date(fine.dueDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${fine.isLost
                                                        ? 'bg-red-500/10 text-red-400'
                                                        : fine.status === 'overdue'
                                                            ? 'bg-yellow-500/10 text-yellow-400'
                                                            : 'bg-gray-500/10 text-gray-400'
                                                    }`}>
                                                    {fine.isLost ? 'Lost' : fine.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-red-400 font-semibold">
                                                    ${fine.fineAmount?.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTransaction(fine);
                                                        setWaiveAmount(fine.fineAmount);
                                                        setShowWaiveModal(true);
                                                    }}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
                                                >
                                                    Waive
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Top Debtors Tab */}
            {activeTab === 'debtors' && (
                <div className="card-dark overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-800/50">
                        <h2 className="text-lg font-semibold text-white">Top Debtors</h2>
                    </div>
                    <div className="overflow-x-auto">
                        {!fineReport?.topDebtors?.length ? (
                            <div className="text-center py-12 text-gray-500">
                                No users with outstanding fines
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-900/30">
                                    <tr className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                        <th className="px-6 py-3">User</th>
                                        <th className="px-6 py-3">Account Status</th>
                                        <th className="px-6 py-3">Fine Count</th>
                                        <th className="px-6 py-3">Total Owed</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/30">
                                    {fineReport.topDebtors.map((debtor, idx) => (
                                        <tr key={idx} className="hover:bg-gray-800/20">
                                            <td className="px-6 py-4 font-medium text-white">
                                                {debtor.user?.name || 'Unknown'}
                                                <br />
                                                <span className="text-xs text-gray-500">{debtor.user?.email}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${debtor.user?.accountStatus === 'blocked'
                                                        ? 'bg-red-500/10 text-red-400'
                                                        : 'bg-green-500/10 text-green-400'
                                                    }`}>
                                                    {debtor.user?.accountStatus === 'blocked' && <Ban className="h-3 w-3" />}
                                                    {debtor.user?.accountStatus || 'active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400">
                                                {debtor.fineCount} fines
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-red-400 font-semibold">
                                                    ${debtor.totalFines?.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {debtor.user?.accountStatus === 'blocked' && (
                                                    <button
                                                        onClick={() => handleUnblockUser(debtor.user._id)}
                                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                                                    >
                                                        <Unlock className="h-3 w-3" />
                                                        Unblock
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Recently Paid Tab */}
            {activeTab === 'recent' && (
                <div className="card-dark overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-800/50">
                        <h2 className="text-lg font-semibold text-white">Recently Paid Fines</h2>
                    </div>
                    <div className="overflow-x-auto">
                        {!fineReport?.recentlyPaid?.length ? (
                            <div className="text-center py-12 text-gray-500">
                                No recently paid fines
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-900/30">
                                    <tr className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                        <th className="px-6 py-3">User</th>
                                        <th className="px-6 py-3">Book</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Payment Date</th>
                                        <th className="px-6 py-3">Method</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/30">
                                    {fineReport.recentlyPaid.map((fine) => (
                                        <tr key={fine._id} className="hover:bg-gray-800/20">
                                            <td className="px-6 py-4 font-medium text-white">
                                                {fine.user?.name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-400">
                                                {fine.book?.title || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-green-400 font-semibold">
                                                    ${fine.fineAmount?.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400">
                                                {fine.finePaymentDate
                                                    ? new Date(fine.finePaymentDate).toLocaleDateString()
                                                    : '-'
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${fine.finePaymentMethod === 'waived'
                                                        ? 'bg-yellow-500/10 text-yellow-400'
                                                        : 'bg-green-500/10 text-green-400'
                                                    }`}>
                                                    {fine.finePaymentMethod || 'unknown'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Fine Policy Info */}
            <div className="card-dark p-5 mt-6 bg-gray-900/30">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    Current Fine Policy
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500">Daily Fine Rate</p>
                        <p className="text-white font-medium">${config?.dailyFineRate?.toFixed(2)}/day</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Max Fine Per Item</p>
                        <p className="text-white font-medium">${config?.maxFinePerItem?.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Grace Period</p>
                        <p className="text-white font-medium">{config?.gracePeriodDays} days</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Account Block Threshold</p>
                        <p className="text-white font-medium">${config?.accountBlockThreshold?.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Lost Item Threshold</p>
                        <p className="text-white font-medium">{config?.lostItemThresholdDays} days overdue</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Processing Fee</p>
                        <p className="text-white font-medium">${config?.lostItemProcessingFee?.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Default Replacement Cost</p>
                        <p className="text-white font-medium">${config?.defaultReplacementCost?.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Waive Fine Modal */}
            {showWaiveModal && selectedTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="card-dark p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-white mb-4">Waive/Adjust Fine</h3>

                        <div className="mb-4">
                            <p className="text-sm text-gray-400 mb-1">
                                User: <span className="font-semibold text-white">{selectedTransaction.user?.name}</span>
                            </p>
                            <p className="text-sm text-gray-400 mb-1">
                                Book: <span className="font-semibold text-white">{selectedTransaction.book?.title}</span>
                            </p>
                            <p className="text-sm text-gray-400 mb-4">
                                Current Fine: <span className="font-semibold text-red-400">${selectedTransaction.fineAmount?.toFixed(2)}</span>
                            </p>

                            <div className="mb-4">
                                <label className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                                    <input
                                        type="checkbox"
                                        checked={waiveAll}
                                        onChange={(e) => setWaiveAll(e.target.checked)}
                                        className="rounded bg-gray-800 border-gray-700"
                                    />
                                    Waive entire fine
                                </label>

                                {!waiveAll && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Amount to Waive ($)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={selectedTransaction.fineAmount}
                                            step="0.01"
                                            value={waiveAmount}
                                            onChange={(e) => setWaiveAmount(parseFloat(e.target.value))}
                                            className="w-full px-4 py-2 bg-gray-900/30 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={waiveNotes}
                                    onChange={(e) => setWaiveNotes(e.target.value)}
                                    placeholder="Reason for waiving..."
                                    className="w-full px-4 py-2 bg-gray-900/30 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowWaiveModal(false);
                                    setSelectedTransaction(null);
                                    setWaiveAmount(0);
                                    setWaiveAll(false);
                                    setWaiveNotes('');
                                }}
                                className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleWaiveFine}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                {waiveAll ? 'Waive All' : `Waive $${waiveAmount.toFixed(2)}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FineManagement;
