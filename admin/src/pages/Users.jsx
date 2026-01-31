import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Ban, Unlock, RefreshCw, Search } from 'lucide-react';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const { admin } = useAuth();

    const fetchUsers = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${admin.token}`,
                },
            };
            const { data } = await axios.get(
                'http://localhost:5000/api/users',
                config
            );
            setUsers(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchUsers, 30000);
        return () => clearInterval(interval);
    }, [admin]);

    const handleUnblock = async (userId) => {
        if (!window.confirm('Unblock this user account?')) return;

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${admin.token}`,
                },
            };
            await axios.put(
                `http://localhost:5000/api/admin/users/${userId}/unblock`,
                {},
                config
            );
            fetchUsers();
            alert('User account unblocked!');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to unblock user');
        }
    };

    const handleBlockUser = async (userId) => {
        const reason = prompt('Enter reason for blocking:');
        if (!reason) return;

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${admin.token}`,
                },
            };
            await axios.put(
                `http://localhost:5000/api/admin/users/${userId}/block`,
                { reason },
                config
            );
            fetchUsers();
            alert('User account blocked!');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to block user');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64">
        <div className="text-gray-400 animate-pulse">Loading users...</div>
    </div>;

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        if (filter === 'all') return matchesSearch;
        if (filter === 'blocked') return matchesSearch && user.accountStatus === 'blocked';
        if (filter === 'members') return matchesSearch && user.isMember;
        if (filter === 'withFines') return matchesSearch && (user.totalUnpaidFines > 0 || user.fines > 0);
        return matchesSearch;
    });

    const stats = {
        total: users.length,
        members: users.filter(u => u.isMember).length,
        blocked: users.filter(u => u.accountStatus === 'blocked').length,
        withFines: users.filter(u => (u.totalUnpaidFines > 0 || u.fines > 0)).length
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Users Management</h1>
                    <p className="text-sm text-gray-500">Manage library members and accounts</p>
                </div>
                <button
                    onClick={fetchUsers}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="h-5 w-5" />
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="card-dark p-4">
                    <div className="text-sm text-gray-500 mb-1">Total Users</div>
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                </div>
                <div className="card-dark p-4">
                    <div className="text-sm text-gray-500 mb-1">Members</div>
                    <div className="text-2xl font-bold text-green-400">{stats.members}</div>
                </div>
                <div className="card-dark p-4">
                    <div className="text-sm text-gray-500 mb-1">Blocked</div>
                    <div className="text-2xl font-bold text-red-400">{stats.blocked}</div>
                </div>
                <div className="card-dark p-4">
                    <div className="text-sm text-gray-500 mb-1">With Fines</div>
                    <div className="text-2xl font-bold text-yellow-400">{stats.withFines}</div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-900/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'members', 'blocked', 'withFines'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {f === 'withFines' ? 'With Fines' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card-dark overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-900/30">
                        <tr className="text-gray-500 text-xs uppercase">
                            <th className="px-5 py-3 font-medium">Name</th>
                            <th className="px-5 py-3 font-medium">Email</th>
                            <th className="px-5 py-3 font-medium">Role</th>
                            <th className="px-5 py-3 font-medium">Member</th>
                            <th className="px-5 py-3 font-medium">Account Status</th>
                            <th className="px-5 py-3 font-medium">Fines</th>
                            <th className="px-5 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/30">
                        {filteredUsers.map((user) => (
                            <tr key={user._id} className={`hover:bg-gray-800/20 transition-colors ${user.accountStatus === 'blocked' ? 'bg-red-500/5' : ''}`}>
                                <td className="px-5 py-4 font-medium text-white">
                                    {user.name}
                                </td>
                                <td className="px-5 py-4 text-gray-400">{user.email}</td>
                                <td className="px-5 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-500/10 text-gray-400'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.isMember ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                                        }`}>
                                        {user.isMember ? 'Yes' : 'No'}
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${user.accountStatus === 'blocked'
                                            ? 'bg-red-500/10 text-red-400'
                                            : 'bg-green-500/10 text-green-400'
                                        }`}>
                                        {user.accountStatus === 'blocked' && <Ban className="h-3 w-3" />}
                                        {user.accountStatus || 'active'}
                                    </span>
                                    {user.accountBlockReason && (
                                        <p className="text-xs text-gray-500 mt-1">{user.accountBlockReason}</p>
                                    )}
                                </td>
                                <td className="px-5 py-4">
                                    {(user.totalUnpaidFines > 0 || user.fines > 0) ? (
                                        <span className="text-red-400 font-semibold">
                                            ${(user.totalUnpaidFines || user.fines || 0).toFixed(2)}
                                        </span>
                                    ) : (
                                        <span className="text-gray-500">$0.00</span>
                                    )}
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex gap-2">
                                        {user.role !== 'admin' && (
                                            <>
                                                {user.accountStatus === 'blocked' ? (
                                                    <button
                                                        onClick={() => handleUnblock(user._id)}
                                                        className="p-1.5 text-green-400 hover:bg-green-500/10 rounded transition-colors"
                                                        title="Unblock User"
                                                    >
                                                        <Unlock className="h-4 w-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleBlockUser(user._id)}
                                                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                        title="Block User"
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No users found
                    </div>
                )}
            </div>
        </div>
    );
};

export default Users;
