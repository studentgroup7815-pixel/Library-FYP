import { useState } from 'react';
import { X, Calendar, DollarSign } from 'lucide-react';
import axios from 'axios';

const RentalModal = ({ isOpen, onClose, book, onSuccess }) => {
    const [rentalDuration, setRentalDuration] = useState(7);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [transactionId, setTransactionId] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentComplete, setPaymentComplete] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const rentalCost = rentalDuration * 2; // $2 per day
    const dueDate = new Date(Date.now() + rentalDuration * 24 * 60 * 60 * 1000);

    const handleRentBook = async () => {
        setLoading(true);
        setError('');

        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.post(
                'http://localhost:5000/api/transactions/rent',
                {
                    bookId: book._id,
                    rentalDuration,
                },
                config
            );

            setTransactionId(data._id);
            setShowPayment(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to rent book');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        setLoading(true);
        setError('');

        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.post(
                `http://localhost:5000/api/transactions/${transactionId}/pay`,
                {},
                config
            );

            setSuccessMessage(data.message);
            setPaymentComplete(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setRentalDuration(7);
        setError('');
        setTransactionId(null);
        setShowPayment(false);
        setPaymentComplete(false);
        setSuccessMessage('');
        onClose();
    };

    if (!isOpen || !book) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card-dark max-w-lg w-full">
                <div className="px-6 py-4 border-b border-gray-800/50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">
                        {paymentComplete ? 'Rental Confirmed!' : showPayment ? 'Payment' : 'Rent Book'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {paymentComplete ? (
                        <div className="space-y-4">
                            <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-lg text-sm">
                                <p className="font-medium mb-2">✓ Payment Successful!</p>
                                <p className="text-green-300">{successMessage}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-gray-400 text-sm">This window will close automatically...</p>
                            </div>
                        </div>
                    ) : showPayment ? (
                        <div className="space-y-4">
                            <div className="card-darker p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Book:</span>
                                    <span className="text-white font-medium">{book.title}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Rental Duration:</span>
                                    <span className="text-white">{rentalDuration} days</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Due Date:</span>
                                    <span className="text-white">{dueDate.toLocaleDateString()}</span>
                                </div>
                                <div className="border-t border-gray-800 pt-3 mt-3">
                                    <div className="flex justify-between">
                                        <span className="text-white font-medium">Total Amount:</span>
                                        <span className="text-purple-400 font-bold text-lg">${rentalCost}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 p-3 rounded-lg text-sm">
                                <p className="font-medium mb-1">Delivery Information:</p>
                                <p className="text-blue-300 text-xs">
                                    Your book will be delivered to your registered address within 3 business days.
                                    Please return it before the due date to the nearest library branch.
                                </p>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={loading}
                                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <DollarSign className="h-4 w-4" />
                                {loading ? 'Processing...' : `Pay $${rentalCost}`}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="card-darker p-4">
                                <h3 className="text-white font-medium mb-2">{book.title}</h3>
                                <p className="text-gray-400 text-sm">by {book.author}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-3">
                                    Select Rental Duration
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[7, 14, 30].map((days) => (
                                        <button
                                            key={days}
                                            type="button"
                                            onClick={() => setRentalDuration(days)}
                                            className={`p-3 rounded-lg border-2 transition-all ${
                                                rentalDuration === days
                                                    ? 'border-purple-600 bg-purple-600/10'
                                                    : 'border-gray-800 hover:border-gray-700'
                                            }`}
                                        >
                                            <div className="text-white font-medium">{days} Days</div>
                                            <div className="text-gray-400 text-xs mt-1">${days * 2}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="card-darker p-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-purple-400" />
                                    <span className="text-gray-400">Due Date:</span>
                                    <span className="text-white font-medium">{dueDate.toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <DollarSign className="h-4 w-4 text-purple-400" />
                                    <span className="text-gray-400">Rental Cost:</span>
                                    <span className="text-white font-medium">${rentalCost}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRentBook}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Continue'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RentalModal;
