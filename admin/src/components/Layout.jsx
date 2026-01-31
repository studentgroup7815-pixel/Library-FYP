import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Book,
    Users,
    ArrowLeftRight,
    DollarSign,
    LogOut,
} from 'lucide-react';

const Layout = () => {
    const { logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex h-screen bg-[#0a0a0f]">
            {/* Sidebar */}
            <div className="w-64 bg-[#16161d] border-r border-gray-800/50 text-white flex flex-col">
                <div className="p-6 border-b border-gray-800/50">
                    <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                    <p className="text-xs text-gray-500 mt-1">Library Management</p>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-1">
                    <Link
                        to="/"
                        className={`flex items-center px-4 py-2.5 rounded-lg transition-colors text-sm ${isActive('/') ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                    >
                        <LayoutDashboard className="h-4 w-4 mr-3" />
                        Dashboard
                    </Link>
                    <Link
                        to="/books"
                        className={`flex items-center px-4 py-2.5 rounded-lg transition-colors text-sm ${isActive('/books') ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                    >
                        <Book className="h-4 w-4 mr-3" />
                        Books
                    </Link>
                    <Link
                        to="/users"
                        className={`flex items-center px-4 py-2.5 rounded-lg transition-colors text-sm ${isActive('/users') ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                    >
                        <Users className="h-4 w-4 mr-3" />
                        Users
                    </Link>
                    <Link
                        to="/transactions"
                        className={`flex items-center px-4 py-2.5 rounded-lg transition-colors text-sm ${isActive('/transactions') ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                    >
                        <ArrowLeftRight className="h-4 w-4 mr-3" />
                        Transactions
                    </Link>
                    <Link
                        to="/fines"
                        className={`flex items-center px-4 py-2.5 rounded-lg transition-colors text-sm ${isActive('/fines') ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                    >
                        <DollarSign className="h-4 w-4 mr-3" />
                        Fines
                    </Link>
                </nav>
                <div className="p-4 border-t border-gray-800/50">
                    <button
                        onClick={logout}
                        className="flex items-center w-full px-4 py-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors text-sm"
                    >
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <main className="p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
