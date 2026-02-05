import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Users, BookOpen, ArrowLeftRight, DollarSign } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalBooks: 0,
        totalTransactions: 0,
        activeRentals: 0,
        overdueRentals: 0,
        totalFines: 0,
    });
    const [loading, setLoading] = useState(true);
    const { admin } = useAuth();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${admin.token}`,
                    },
                };
                const { data } = await axios.get(
                    `${import.meta.env.VITE_API_URL}/admin/stats`,
                    config
                );
                setStats(data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };

        fetchStats();
    }, [admin]);

    if (loading) return <div>Loading...</div>;

    const data = [
        { name: 'Users', count: stats.totalUsers },
        { name: 'Books', count: stats.totalBooks },
        { name: 'Rentals', count: stats.activeRentals },
        { name: 'Overdue', count: stats.overdueRentals },
    ];

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Library Management Overview</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="card-dark p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-gray-400 text-sm font-medium">Total Users</h3>
                        <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
                <div className="card-dark p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-gray-400 text-sm font-medium">Total Books</h3>
                        <BookOpen className="h-5 w-5 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.totalBooks}</p>
                </div>
                <div className="card-dark p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-gray-400 text-sm font-medium">Active Rentals</h3>
                        <ArrowLeftRight className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {stats.activeRentals}
                    </p>
                </div>
                <div className="card-dark p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-gray-400 text-sm font-medium">Total Revenue</h3>
                        <DollarSign className="h-5 w-5 text-yellow-500" />
                    </div>
                    <p className="text-2xl font-bold text-white">${stats.totalFines}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-dark p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Overview</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" />
                                <XAxis dataKey="name" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#16161d',
                                        border: '1px solid #2a2a35',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="count" fill="#9333ea" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card-dark p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Key Metrics</h3>
                    <div className="space-y-4">
                        <div className="card-darker p-4 rounded-lg">
                            <div>
                                <div className="text-sm text-gray-500">Books per User</div>
                                <div className="text-2xl font-bold text-blue-400">
                                    {stats.totalUsers > 0 ? (stats.totalBooks / stats.totalUsers).toFixed(1) : 0}
                                </div>
                            </div>
                        </div>
                        <div className="card-darker p-4 rounded-lg">
                            <div>
                                <div className="text-sm text-gray-500">Rental Rate</div>
                                <div className="text-2xl font-bold text-green-400">
                                    {stats.totalBooks > 0 ? ((stats.activeRentals / stats.totalBooks) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                        </div>
                        <div className="card-darker p-4 rounded-lg">
                            <div>
                                <div className="text-sm text-gray-500">Avg Fine per Transaction</div>
                                <div className="text-2xl font-bold text-yellow-400">
                                    ${stats.totalTransactions > 0 ? (stats.totalFines / stats.totalTransactions).toFixed(2) : '0.00'}
                                </div>
                            </div>
                        </div>
                        {stats.overdueRentals > 0 && (
                            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                                <div>
                                    <div className="text-sm text-red-400 font-semibold">⚠️ Overdue Alert</div>
                                    <div className="text-2xl font-bold text-red-400">
                                        {stats.overdueRentals} books overdue
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
