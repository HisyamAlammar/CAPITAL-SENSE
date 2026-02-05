'use client';

import { useState } from 'react';
import axios from 'axios';
import { Star, Send, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewForm() {
    const [name, setName] = useState('');
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return alert('Silakan berikan rating bintang!');

        setLoading(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/`, {
                name: name || "Anonymous",
                rating,
                comment
            });
            setSubmitted(true);
            setName('');
            setRating(0);
            setComment('');
            setTimeout(() => setSubmitted(false), 5000); // Reset success message after 5s
        } catch (error) {
            console.error("Failed to submit review", error);
            alert("Gagal mengirim review. Coba lagi nanti.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="w-full max-w-2xl mx-auto mt-12 mb-20 px-6">
            <div className="glass-panel p-8 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                        Bantu Kami Berkembang! 🚀
                    </h3>
                    <p className="text-sm text-gray-400 mt-2">
                        Masukan Anda sangat berharga untuk pengembangan website ini.
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {submitted ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center justify-center py-10"
                        >
                            <CheckCircle size={64} className="text-green-400 mb-4" />
                            <h4 className="text-xl font-bold text-white">Terima Kasih!</h4>
                            <p className="text-gray-400">Review Anda berhasil dikirim.</p>
                        </motion.div>
                    ) : (
                        <motion.form
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-4"
                        >
                            {/* Star Rating */}
                            <div className="flex justify-center gap-2 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="transition-transform hover:scale-110 focus:outline-none"
                                    >
                                        <Star
                                            size={32}
                                            className={`${star <= (hoverRating || rating)
                                                    ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                                                    : "text-gray-600"
                                                } transition-colors`}
                                        />
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 ml-1 mb-1 block">Nama (Opsional)</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Nama Anda..."
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 ml-1 mb-1 block">Ulasan</label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Ceritakan pengalaman Anda menggunakan website ini..."
                                        required
                                        rows={4}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-4 w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    "Mengirim..."
                                ) : (
                                    <>
                                        <Send size={18} /> Kirim Review
                                    </>
                                )}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
