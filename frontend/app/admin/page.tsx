'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Star, Lock, RefreshCw, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Review {
    id: number;
    name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export default function AdminPage() {
    const [passcode, setPasscode] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (passcode === 'ADMINCS') {
            setIsAuthenticated(true);
            fetchReviews();
        } else {
            setError('Kode akses salah!');
            setPasscode('');
        }
    };

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/`);
            setReviews(res.data);
        } catch (err) {
            console.error("Failed to fetch reviews", err);
            setError("Gagal mengambil data review.");
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0a]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full glass-panel p-8 rounded-2xl border border-white/10"
                >
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center">
                            <Shield size={32} className="text-cyan-400" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center mb-2">Admin Access</h2>
                    <p className="text-gray-400 text-center mb-6 text-sm">Masukan kode rahasia untuk mengakses dashboard admin.</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                            <input
                                type="password"
                                value={passcode}
                                onChange={(e) => {
                                    setPasscode(e.target.value);
                                    setError('');
                                }}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-10 py-3 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                                placeholder="Passcode"
                            />
                        </div>
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                        >
                            Masuk Dashboard
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-6 pb-24 max-w-7xl mx-auto pt-24">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-400">Monitoring Ulasan Pengguna</p>
                </div>
                <button
                    onClick={fetchReviews}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors self-start md:self-auto"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    Refresh Data
                </button>
            </header>

            {loading && reviews.length === 0 ? (
                <div className="text-center py-20 text-gray-500">Loading data...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reviews.map((review) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-panel p-6 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative"
                        >
                            <div className="absolute top-4 right-4 flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={14}
                                        className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-700"}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 flex items-center justify-center border border-white/10">
                                    <User size={18} className="text-gray-300" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">{review.name}</h4>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Calendar size={10} />
                                        {new Date(review.created_at).toLocaleDateString('id-ID', {
                                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>

                            <p className="text-gray-300 text-sm leading-relaxed">
                                "{review.comment}"
                            </p>
                        </motion.div>
                    ))}

                    {reviews.length === 0 && (
                        <div className="col-span-full text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-xl">
                            Belum ada ulasan masuk.
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
