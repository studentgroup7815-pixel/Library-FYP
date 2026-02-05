import { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

const MembershipModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        cnic: '',
        address: '',
        phone: '',
        city: '',
        postalCode: '',
        emergencyContact: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            await axios.post(
                `${import.meta.env.VITE_API_URL}/users/membership`,
                formData,
                config
            );

            alert('Membership registered successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to register membership');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card-dark max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-[#16161d] px-6 py-4 border-b border-gray-800/50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Library Membership Registration</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <p className="text-gray-400 text-sm mb-4">
                        Complete this form to become a library member and rent books.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                required
                                className="w-full px-4 py-2.5 bg-[#0d0d12] border border-gray-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
                                placeholder="John Doe"
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                CNIC *
                            </label>
                            <input
                                type="text"
                                name="cnic"
                                required
                                className="w-full px-4 py-2.5 bg-[#0d0d12] border border-gray-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
                                placeholder="12345-1234567-1"
                                value={formData.cnic}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Address *
                            </label>
                            <input
                                type="text"
                                name="address"
                                required
                                className="w-full px-4 py-2.5 bg-[#0d0d12] border border-gray-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
                                placeholder="Street Address"
                                value={formData.address}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Phone *
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                required
                                className="w-full px-4 py-2.5 bg-[#0d0d12] border border-gray-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
                                placeholder="0300-1234567"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                City *
                            </label>
                            <input
                                type="text"
                                name="city"
                                required
                                className="w-full px-4 py-2.5 bg-[#0d0d12] border border-gray-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
                                placeholder="Karachi"
                                value={formData.city}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Postal Code *
                            </label>
                            <input
                                type="text"
                                name="postalCode"
                                required
                                className="w-full px-4 py-2.5 bg-[#0d0d12] border border-gray-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
                                placeholder="75500"
                                value={formData.postalCode}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Emergency Contact *
                            </label>
                            <input
                                type="tel"
                                name="emergencyContact"
                                required
                                className="w-full px-4 py-2.5 bg-[#0d0d12] border border-gray-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
                                placeholder="0321-7654321"
                                value={formData.emergencyContact}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Register Membership'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MembershipModal;
