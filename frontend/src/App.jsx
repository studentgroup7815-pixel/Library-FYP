import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Books from './pages/Books';
import BookDetails from './pages/BookDetails';
import Dashboard from './pages/Dashboard';
import Fines from './pages/Fines';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

function AppContent() {
    const { user } = useAuth();
    const location = useLocation();
    const isPublicPage = ['/', '/login', '/register'].includes(location.pathname) && !user;

    return (
        <div className={`min-h-screen ${isPublicPage ? 'bg-white' : 'bg-[#0a0a0f]'}`}>
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <Routes>
                    <Route
                        path="/"
                        element={
                            <PublicRoute>
                                <Home />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <Login />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <PublicRoute>
                                <Register />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/books"
                        element={
                            <ProtectedRoute>
                                <Books />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/books/:id" element={<BookDetails />} />
                    <Route
                        path="/fines"
                        element={
                            <ProtectedRoute>
                                <Fines />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

export default App;
