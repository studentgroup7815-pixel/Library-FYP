import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, BookOpen } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();

    // Show dark navbar for authenticated users, light for public pages
    const isDarkNav = user !== null;

    return (
        <nav className={`sticky top-0 z-50 ${isDarkNav
                ? 'bg-[#16161d]/80 backdrop-blur-xl border-b border-gray-800/50'
                : 'bg-white/80 backdrop-blur-xl border-b border-gray-200'
            }`}>
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2 group">
                        <BookOpen className={`h-7 w-7 ${isDarkNav ? 'text-purple-500' : 'text-purple-600'}`} />
                        <span className={`text-xl font-bold ${isDarkNav ? 'text-white' : 'text-gray-900'}`}>LibSystem</span>
                    </Link>

                    <div className="flex items-center space-x-1">
                        {user ? (
                            <>
                                <Link
                                    to="/books"
                                    className="text-gray-400 hover:text-white px-4 py-2 text-sm font-medium transition-colors"
                                >
                                    Browse Books
                                </Link>
                                <Link
                                    to="/dashboard"
                                    className="text-gray-400 hover:text-white px-4 py-2 text-sm font-medium transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/fines"
                                    className="text-gray-400 hover:text-white px-4 py-2 text-sm font-medium transition-colors"
                                >
                                    My Fines
                                </Link>
                                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-800">
                                    <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm text-gray-300">{user.name}</span>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link
                                    to="/"
                                    className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium transition-colors"
                                >
                                    Home
                                </Link>
                                <Link
                                    to="/login"
                                    className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors ml-2"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
