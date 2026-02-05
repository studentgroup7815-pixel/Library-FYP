import { useState, useEffect } from 'react';
import { X, CreditCard, Lock, Calendar } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, amount, onSuccess, title = 'Secure Payment' }) => {
    const [formData, setFormData] = useState({
        cardName: '',
        cardNumber: '',
        expiry: '',
        cvv: ''
    });
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('input'); // input, processing, success

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                cardName: '',
                cardNumber: '',
                expiry: '',
                cvv: ''
            });
            setStep('input');
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const formatCardNumber = (value) => {
        const v = value.replace(/\D/g, '').substr(0, 16);
        const parts = [];
        for (let i = 0; i < v.length; i += 4) {
            parts.push(v.substr(i, 4));
        }
        return parts.length > 1 ? parts.join(' ') : value;
    };

    const formatExpiry = (value) => {
        const v = value.replace(/\D/g, '').substr(0, 4);
        if (v.length >= 2) {
            return `${v.substr(0, 2)}/${v.substr(2, 2)}`;
        }
        return v;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'cardNumber') {
            formattedValue = formatCardNumber(value);
        } else if (name === 'expiry') {
            formattedValue = formatExpiry(value);
        } else if (name === 'cvv') {
            formattedValue = value.replace(/\D/g, '').substr(0, 3);
        }

        setFormData(prev => ({
            ...prev,
            [name]: formattedValue
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStep('processing');

        // Simulate API delay for realism
        setTimeout(() => {
            setStep('success');
            setTimeout(() => {
                onSuccess();
                // We let the parent close the modal to handle cleanup/transition
            }, 1000);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="card-dark max-w-md w-full relative overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-800/50 flex justify-between items-center bg-[#16161d]">
                    <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-green-500" />
                        <h2 className="text-lg font-bold text-white">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                        disabled={loading}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    {step === 'processing' ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <CreditCard className="h-6 w-6 text-white/50" />
                                </div>
                            </div>
                            <h3 className="text-xl font-medium text-white">Processing Payment</h3>
                            <p className="text-gray-400">Please verify the transaction on your device if prompted...</p>
                        </div>
                    ) : step === 'success' ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">Payment Successful!</h3>
                            <p className="text-gray-400">Your transaction has been confirmed.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 mb-6">
                                <p className="text-sm text-purple-300 mb-1">Total Amount</p>
                                <p className="text-3xl font-bold text-white">${Number(amount).toFixed(2)}</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Cardholder Name</label>
                                    <input
                                        type="text"
                                        name="cardName"
                                        required
                                        className="w-full px-4 py-2.5 bg-[#0a0a0f] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-colors"
                                        placeholder="John Doe"
                                        value={formData.cardName}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Card Number</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="cardNumber"
                                            required
                                            maxLength="19"
                                            className="w-full px-4 py-2.5 pl-11 bg-[#0a0a0f] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-colors font-mono"
                                            placeholder="0000 0000 0000 0000"
                                            value={formData.cardNumber}
                                            onChange={handleChange}
                                        />
                                        <CreditCard className="absolute left-3.5 top-2.5 h-5 w-5 text-gray-500" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Expiry Date</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="expiry"
                                                required
                                                maxLength="5"
                                                className="w-full px-4 py-2.5 pl-11 bg-[#0a0a0f] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-colors font-mono"
                                                placeholder="MM/YY"
                                                value={formData.expiry}
                                                onChange={handleChange}
                                            />
                                            <Calendar className="absolute left-3.5 top-2.5 h-5 w-5 text-gray-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">CVV</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                name="cvv"
                                                required
                                                maxLength="3"
                                                className="w-full px-4 py-2.5 pl-11 bg-[#0a0a0f] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-colors font-mono"
                                                placeholder="123"
                                                value={formData.cvv}
                                                onChange={handleChange}
                                            />
                                            <Lock className="absolute left-3.5 top-2.5 h-5 w-5 text-gray-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-purple-900/20 transform transition-all active:scale-[0.98] mt-6"
                            >
                                Pay ${Number(amount).toFixed(2)}
                            </button>

                            <div className="flex justify-center items-center gap-2 mt-4 text-xs text-gray-500">
                                <Lock className="h-3 w-3" />
                                <span>Payments are secure and encrypted</span>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
