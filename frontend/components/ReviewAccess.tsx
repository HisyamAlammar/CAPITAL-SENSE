'use client';

import { useState } from 'react';
import { MessageSquarePlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewForm from './ReviewForm';

export default function ReviewAccess() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Trigger Button */}
            <div className="flex justify-center py-10">
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-full overflow-hidden hover:bg-white/10 transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <MessageSquarePlus className="text-cyan-400 group-hover:rotate-12 transition-transform" />
                    <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:from-cyan-200 group-hover:to-purple-200">
                        Beri Ulasan Aplikasi
                    </span>
                </button>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="max-h-[85vh] overflow-y-auto">
                                <ReviewForm />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
