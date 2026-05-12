'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Star, RefreshCw, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface Review {
    id: number;
    name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export default function AdminPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchReviews = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('/api/admin/reviews');
            setReviews(res.data);
        } catch (err) {
            console.error("Failed to fetch reviews", err);
            setError("Gagal mengambil data review.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    return (
        <main className="min-h-screen p-6 pb-24 max-w-7xl mx-auto pt-24">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Shield size={28} className="text-cyan-400" />
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                            Admin Dashboard
                        </h1>
                    </div>
                    <p className="text-gray-400">Monitoring Ulasan Pengguna</p>
                </div>
                <button
                    onClick={fetchReviews}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors self-start md:self-auto disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    Refresh Data
                </button>
            </header>

            {error && (
                <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

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
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                </div>
                            </div>

                            <p className="text-gray-300 text-sm leading-relaxed">
                                &ldquo;{review.comment}&rdquo;
                            </p>
                        </motion.div>
                    ))}

                    {reviews.length === 0 && !error && (
                        <div className="col-span-full text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-xl">
                            Belum ada ulasan masuk.
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
