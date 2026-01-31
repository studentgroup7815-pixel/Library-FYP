import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const adminInfo = localStorage.getItem('adminInfo');
        if (adminInfo) {
            setAdmin(JSON.parse(adminInfo));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password,
            });
            if (data.role !== 'admin') {
                throw new Error('Not authorized as admin');
            }
            setAdmin(data);
            localStorage.setItem('adminInfo', JSON.stringify(data));
            return data;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    };

    const logout = () => {
        localStorage.removeItem('adminInfo');
        setAdmin(null);
    };

    return (
        <AuthContext.Provider value={{ admin, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
