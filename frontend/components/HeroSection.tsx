'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, TrendingUp, AlertTriangle } from 'lucide-react';

export default function HeroSection() {
    const [showLearnModal, setShowLearnModal] = useState(false);

    const scrollToDashboard = () => {
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <>
            <section className="relative w-full py-20 px-6 flex flex-col items-center justify-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-6 inline-block backdrop-blur-sm">
                        🚀 Market Radar Indonesia
                    </span>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                        Pantau Saham <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 neon-text-blue">
                            Tanpa Ribet
                        </span>
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                        Analisis sentimen berita ekonomi dan data saham real-time dalam satu dashboard yang <i>aesthetic</i>. Buat keputusan investasi lebih cerdas.
                    </p>

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={scrollToDashboard}
                            className="px-8 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-95"
                        >
                            Mulai Pantau
                        </button>
                        <button
                            onClick={() => setShowLearnModal(true)}
                            className="px-8 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-all font-medium backdrop-blur-sm active:scale-95"
                        >
                            Pelajari Dulu
                        </button>
                    </div>
                </motion.div>
            </section>

            {/* Learn Modal */}
            <AnimatePresence>
                {showLearnModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLearnModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
                        >
                            {/* Modal Content */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 to-purple-500" />
                            <button
                                onClick={() => setShowLearnModal(false)}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                                    <BookOpen size={24} />
                                </div>
                                <h2 className="text-2xl font-bold">Kenapa Harus Investasi Saham?</h2>
                            </div>

                            <div className="space-y-6 text-gray-300 leading-relaxed">
                                <p>
                                    Investasi saham itu bukan cuma buat orang tua berdasi. Di era digital, Gen Z punya akses lebih mudah untuk menumbuhkan aset sedari dini.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors">
                                        <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold">
                                            <TrendingUp size={18} />
                                            <h3>Potensi Cuan Tinggi</h3>
                                        </div>
                                        <p className="text-sm text-gray-400">
                                            Saham blue chip (BBCA, BBRI) secara historis memberikan return di atas inflasi jangka panjang.
                                        </p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-red-500/30 transition-colors">
                                        <div className="flex items-center gap-2 mb-2 text-red-400 font-bold">
                                            <AlertTriangle size={18} />
                                            <h3>High Risk High Return</h3>
                                        </div>
                                        <p className="text-sm text-gray-400">
                                            Jangan FOMO! Harga saham bisa turun. Gunakan uang dingin & analisis (seperti website ini).
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-sm text-blue-300">
                                    💡 <strong>Tips Pro:</strong> Gunakan fitur "Prediksi" di website ini untuk melihat sinyal teknikal dan sentimen berita sebelum membeli.
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <button
                                    onClick={() => { setShowLearnModal(false); scrollToDashboard(); }}
                                    className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                                >
                                    Oke, Saya Siap Pantau! 👇
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
