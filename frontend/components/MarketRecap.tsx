'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
// import ReactMarkdown from 'react-markdown'; // Optional, but simple text is fine too

export default function MarketRecap() {
    const [recap, setRecap] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchRecap = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/analysis/recap`);
            setRecap(res.data);
        } catch (error) {
            console.error("Failed to fetch recap", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecap();
    }, []);

    const renderFormattedText = (text: string) => {
        if (!text) return "";
        // Split by **bold** markers
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="text-white font-bold">{part.slice(2, -2)}</strong>;
            }
            return <span key={index}>{part}</span>;
        });
    };

    if (!recap) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-7xl mx-auto px-6 mb-8"
        >
            <div className="relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-r from-purple-500 via-cyan-500 to-blue-500">
                <div className="bg-black/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 relative z-10">

                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />

                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between relative z-20">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="text-yellow-400 animate-pulse" size={24} />
                                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-amber-500">
                                    AI Market Recap (Harian)
                                </h3>
                            </div>

                            {loading ? (
                                <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse" />
                            ) : (
                                <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed text-lg">
                                    {renderFormattedText(recap.recap)}
                                </div>
                            )}
                        </div>

                        {/* Stats / Mood Badge */}
                        {!loading && recap.mood && (
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                                <div className="text-center">
                                    <span className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Market Mood</span>
                                    <span className={`text-xl font-bold ${recap.mood === 'Optimis' ? 'text-green-400' : recap.mood === 'Waspada' ? 'text-red-400' : 'text-yellow-400'}`}>
                                        {recap.mood}
                                    </span>
                                </div>
                                <div className="w-px h-10 bg-white/10" />
                                <div className="text-center">
                                    <span className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Top Topic</span>
                                    <span className="text-sm font-bold text-white max-w-[100px] truncate block" title={recap.top_topic}>
                                        {recap.top_topic ? recap.top_topic.split(',')[0] === 'Ihsg' ? 'IHSG' : recap.top_topic.split(',')[0] : "-"}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
