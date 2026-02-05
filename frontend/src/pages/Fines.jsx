import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    DollarSign,
    AlertTriangle,
    CheckCircle,
    Clock,
    BookX,
    CreditCard,
    History,
    AlertCircle,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import PaymentModal from '../components/PaymentModal';

const Fines = () => {
    const [finesData, setFinesData] = useState(null);
    const [fineSummary, setFineSummary] = useState(null);
    const [fineHistory, setFineHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingFine, setPayingFine] = useState(null);
    const [payingAll, setPayingAll] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedFineAmount, setSelectedFineAmount] = useState(0);
    const [paymentType, setPaymentType] = useState(null); // 'single' or 'all'
    const { user } = useAuth();

    const fetchData = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const [finesRes, summaryRes, historyRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/fines`, config),
                axios.get(`${import.meta.env.VITE_API_URL}/fines/summary`, config),
                axios.get(`${import.meta.env.VITE_API_URL}/fines/history`, config)
            ]);

            setFinesData(finesRes.data);
            setFineSummary(summaryRes.data);
            setFineHistory(historyRes.data.history || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching fines:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handlePayFine = async (transactionId, amount) => {
        setPayingFine(transactionId);
        setSelectedFineAmount(amount);
        setPaymentType('single');
        setShowPaymentModal(true);
    };

    const handlePayAllFines = async () => {
        if (!finesData?.totalUnpaid) return;
        setPaymentType('all');
        setSelectedFineAmount(finesData.totalUnpaid);
        setShowPaymentModal(true);
    };

    const processPayment = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            if (paymentType === 'single') {
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/fines/${payingFine}/pay`,
                    { paymentMethod: 'online' },
                    config
                );
                alert('Fine paid successfully!');
            } else {
                setPayingAll(true);
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/fines/pay-all`,
                    { paymentMethod: 'online' },
                    config
                );
                alert(`Successfully paid $${response.data.totalPaid.toFixed(2)} for ${response.data.paidTransactions.length} fines!`);
            }

            setShowPaymentModal(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to pay fine');
        } finally {
            setPayingFine(null);
            setPayingAll(false);
        }
    };



    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-400 animate-pulse">Loading fines...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    setPayingFine(null);
                    setPayingAll(false);
                }}
                amount={selectedFineAmount}
                onSuccess={processPayment}
                title={paymentType === 'all' ? 'Pay All Fines' : 'Pay Fine'}
            />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">My Fines</h1>
                <p className="text-sm text-gray-500">View and pay your library fines</p>
            </div>

            {/* Account Status Warning */}
            {fineSummary?.isBlocked && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                        <div>
                            <p className="text-red-400 font-medium">Account Blocked</p>
                            <p className="text-red-300 text-sm mt-1">
                                {fineSummary.accountBlockReason || 'Your account is blocked due to unpaid fines.'}
                                {' '}Please pay your outstanding fines to restore borrowing privileges.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card-dark p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Unpaid Fines</span>
                        <DollarSign className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">
                        ${fineSummary?.totalUnpaidFines?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        {finesData?.unpaidFines?.length || 0} unpaid transactions
                    </p>
                </div>

                <div className="card-dark p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Overdue Items</span>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{fineSummary?.overdueItems || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">Currently overdue</p>
                </div>

                <div className="card-dark p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Lost Items</span>
                        <BookX className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{fineSummary?.lostItems || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">Marked as lost</p>
                </div>
            </div>

            {/* Fine Policy Info */}
            <div className="card-dark p-4 mb-6 bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="text-sm">
                        <p className="text-blue-400 font-medium mb-1">Fine Policy</p>
                        <ul className="text-blue-300 space-y-1">
                            <li>• Grace period: <span className="font-semibold">{fineSummary?.gracePeriodDays || 3} days</span> after due date</li>
                            <li>• Daily fine rate: <span className="font-semibold">${fineSummary?.dailyFineRate?.toFixed(2) || '0.50'}/day</span></li>
                            <li>• Maximum fine per item: <span className="font-semibold">${fineSummary?.maxFinePerItem?.toFixed(2) || '25.00'}</span></li>
                            <li>• Accounts blocked at: <span className="font-semibold">${fineSummary?.blockThreshold?.toFixed(2) || '50.00'}</span> unpaid fines</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Pay All Button */}
            {finesData?.unpaidFines?.length > 0 && (
                <div className="mb-6">
                    <button
                        onClick={handlePayAllFines}
                        disabled={payingAll}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <CreditCard className="h-5 w-5" />
                        {payingAll ? 'Processing Payment...' : `Pay All Fines ($${finesData.totalUnpaid.toFixed(2)})`}
                    </button>
                </div>
            )}

            {/* Unpaid Fines */}
            <div className="card-dark mb-6">
                <div className="px-5 py-4 border-b border-gray-800/50 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Unpaid Fines</h2>
                    <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
                        {finesData?.unpaidFines?.length || 0} items
                    </span>
                </div>
                <div className="p-5">
                    {!finesData?.unpaidFines?.length ? (
                        <div className="text-center py-12">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                            <p className="text-gray-400">No unpaid fines!</p>
                            <p className="text-sm text-gray-600 mt-1">You're all caught up</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {finesData.unpaidFines.map((fine) => (
                                <div
                                    key={fine._id}
                                    className={`p-4 rounded-lg border transition-colors ${fine.isLost
                                        ? 'bg-red-950/20 border-red-900/50'
                                        : fine.currentlyAccruing
                                            ? 'bg-yellow-950/20 border-yellow-900/50'
                                            : 'bg-gray-900/30 border-gray-800/50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-white">{fine.book?.title}</h4>
                                                {fine.isLost && (
                                                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                                                        Lost
                                                    </span>
                                                )}
                                                {fine.currentlyAccruing && (
                                                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full animate-pulse">
                                                        Accruing
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">{fine.book?.author}</p>

                                            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-600">
                                                <span>Due: {new Date(fine.dueDate).toLocaleDateString()}</span>
                                                {fine.returnDate && (
                                                    <span>Returned: {new Date(fine.returnDate).toLocaleDateString()}</span>
                                                )}
                                                {fine.fineDetails?.daysOverdue > 0 && (
                                                    <span className="text-red-400">
                                                        {fine.fineDetails.daysOverdue} days overdue
                                                    </span>
                                                )}
                                            </div>

                                            {/* Fine Breakdown */}
                                            {fine.fineDetails?.breakdown?.length > 0 && (
                                                <div className="mt-3 p-2 bg-gray-900/50 rounded text-xs">
                                                    {fine.fineDetails.breakdown.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between text-gray-400">
                                                            <span>{item.description}</span>
                                                            <span>${item.amount.toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-red-400">
                                                ${fine.fineAmount?.toFixed(2)}
                                            </p>
                                            <button
                                                onClick={() => handlePayFine(fine._id, fine.fineAmount)}
                                                disabled={payingFine === fine._id}
                                                className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {payingFine === fine._id ? 'Paying...' : 'Pay Now'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Payment History */}
            <div className="card-dark">
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full px-5 py-4 border-b border-gray-800/50 flex items-center justify-between text-left hover:bg-gray-900/30 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-gray-400" />
                        <h2 className="text-lg font-semibold text-white">Payment History</h2>
                    </div>
                    {showHistory ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                </button>

                {showHistory && (
                    <div className="p-5">
                        {fineHistory.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No payment history yet</p>
                        ) : (
                            <div className="space-y-3">
                                {fineHistory.map((payment, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg"
                                    >
                                        <div>
                                            <p className="text-sm text-white">{payment.notes}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(payment.paymentDate).toLocaleDateString()} •{' '}
                                                {payment.paymentMethod}
                                            </p>
                                        </div>
                                        <span className="text-green-400 font-semibold">
                                            ${payment.amount.toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Fines;
