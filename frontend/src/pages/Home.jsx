import { Link } from 'react-router-dom';
import { BookOpen, Users, Clock, Shield, Search, TrendingUp } from 'lucide-react';

const Home = () => {
    return (
        <div className="min-h-screen bg-white -mt-8 -mx-4">
            {/* Hero Section */}
            <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h1 className="text-5xl md:text-6xl font-bold leading-tight text-gray-900">
                                Welcome to Your
                                <br />
                                <span className="text-purple-600">Digital Library</span>
                            </h1>
                            <p className="text-lg text-gray-600">
                                Discover thousands of books, manage your reading journey, and explore a world of knowledge at your fingertips.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    to="/register"
                                    className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors text-center"
                                >
                                    Get Started
                                </Link>
                                <Link
                                    to="/login"
                                    className="bg-white text-purple-600 px-8 py-3 rounded-lg font-medium border-2 border-purple-600 hover:bg-purple-50 transition-colors text-center"
                                >
                                    Login
                                </Link>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <img
                                src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=600&fit=crop"
                                alt="Library books"
                                className="rounded-2xl shadow-2xl"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Why Choose Our Library?
                        </h2>
                        <p className="text-lg text-gray-600">
                            Experience modern library management with powerful features
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-white p-6 rounded-xl border-2 border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all">
                            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                <BookOpen className="h-6 w-6 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Extensive Collection
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Access thousands of books across various genres. From classics to contemporary bestsellers.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border-2 border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all">
                            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                <Search className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Easy Search & Browse
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Find your next read quickly with our advanced search and filtering system.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border-2 border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all">
                            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                <Clock className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Simple Borrowing
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Borrow and return books with ease. Track due dates and manage your reading list.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border-2 border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all">
                            <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                <Users className="h-6 w-6 text-yellow-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Personal Dashboard
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Track your borrowed books, reading history, and manage your library account.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border-2 border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all">
                            <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                <Shield className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Secure & Reliable
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Your data is safe with us. Enjoy a seamless and secure library experience.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border-2 border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all">
                            <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                <TrendingUp className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Track Your Progress
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Monitor your reading statistics, fines, and borrowing history all in one place.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 px-4 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Library by the Numbers
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="bg-white p-6 rounded-xl text-center border-2 border-gray-100">
                            <div className="text-4xl font-bold text-purple-600 mb-2">5000+</div>
                            <div className="text-gray-600 font-medium">Books Available</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl text-center border-2 border-gray-100">
                            <div className="text-4xl font-bold text-blue-600 mb-2">2000+</div>
                            <div className="text-gray-600 font-medium">Active Members</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl text-center border-2 border-gray-100">
                            <div className="text-4xl font-bold text-green-600 mb-2">50+</div>
                            <div className="text-gray-600 font-medium">Book Categories</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl text-center border-2 border-gray-100">
                            <div className="text-4xl font-bold text-indigo-600 mb-2">24/7</div>
                            <div className="text-gray-600 font-medium">Online Access</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 bg-gradient-to-br from-purple-600 to-blue-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-4 text-white">
                        Ready to Start Your Reading Journey?
                    </h2>
                    <p className="text-lg mb-8 text-purple-100">
                        Join thousands of readers who trust our library management system
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/register"
                            className="bg-white text-purple-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                        >
                            Create Account
                        </Link>
                        <Link
                            to="/login"
                            className="bg-purple-700 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-800 transition-colors border-2 border-white/20"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
