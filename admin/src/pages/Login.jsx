import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err || 'Failed to login');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="card-dark p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6 text-white">
                    Admin Login
                </h2>
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                            <input
                                type="email"
                                required
                                className="w-full pl-10 pr-4 py-2.5 bg-[#0d0d12] border border-gray-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
                                placeholder="admin@library.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                            <input
                                type="password"
                                required
                                className="w-full pl-10 pr-4 py-2.5 bg-[#0d0d12] border border-gray-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors text-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-purple-600 text-white py-2.5 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm mt-6"
                    >
                        Login to Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
