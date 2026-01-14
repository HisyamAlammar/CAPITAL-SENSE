'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Newspaper } from 'lucide-react';
import clsx from 'clsx';

interface Article {
    title: string;
    description?: string;
    source: string;
    link: string;
    published_at: string;
    sentiment_label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    sentiment_score: number;
}

export default function NewsFeed({ limit }: { limit?: number }) {
    const [news, setNews] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Debounce Logic
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 800); // 800ms delay to prevent spam
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Fetch News with Server-Side Search
    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                // Use the query or default to "Global"
                const q = debouncedQuery || "Global";
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/news/`, {
                    params: { q }
                });
                setNews(res.data);
            } catch (error) {
                console.error("Failed to fetch news", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, [debouncedQuery]);

    // Limit display if needed
    const displayNews = limit ? news.slice(0, limit) : news;

    return (
        <section id="news" className="w-full max-w-7xl mx-auto px-6 py-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-3">
                    <Newspaper className="text-purple-400" size={28} />
                    <h2 className="text-2xl font-bold">Market Sentiment & News</h2>
                </div>

                {/* News Search Bar */}
                <div className="relative w-full md:w-72">
                    <input
                        type="text"
                        placeholder="Cari berita ekonomi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors pl-10"
                    />
                    <div className="absolute left-3 top-2.5 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    [1, 2, 3, 4].slice(0, limit || 4).map(i => (
                        <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
                    ))
                ) : (
                    displayNews.length > 0 ? (
                        displayNews.map((item, i) => (
                            <motion.a
                                key={i}
                                href={item.link}
                                target="_blank"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={clsx(
                                    "relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                                    item.sentiment_label === 'POSITIVE' && "hover:shadow-[0_0_20px_rgba(74,222,128,0.2)] hover:border-green-500/30",
                                    item.sentiment_label === 'NEGATIVE' && "hover:shadow-[0_0_20px_rgba(248,113,113,0.2)] hover:border-red-500/30",
                                    item.sentiment_label === 'NEUTRAL' && "hover:shadow-[0_0_20px_rgba(148,163,184,0.2)] hover:border-slate-500/30",
                                )}
                            >
                                {/* Sentiment Indicator Bar */}
                                <div className={clsx(
                                    "absolute left-0 top-0 bottom-0 w-1",
                                    item.sentiment_label === 'POSITIVE' && "bg-gradient-to-b from-green-400 to-green-600",
                                    item.sentiment_label === 'NEGATIVE' && "bg-gradient-to-b from-red-400 to-red-600",
                                    item.sentiment_label === 'NEUTRAL' && "bg-gradient-to-b from-slate-400 to-slate-600",
                                )} />

                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 text-xs text-gray-400 uppercase tracking-widest">
                                            <span>{item.source}</span>
                                            <span>•</span>
                                            <span>{new Date(item.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                        </div>
                                        <h3 className="text-lg font-medium leading-snug group-hover:text-white text-gray-200 transition-colors">
                                            {item.title}
                                        </h3>
                                        {item.description && (
                                            <p className="text-sm text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Sentiment Badge */}
                                    <div className={clsx(
                                        "px-3 py-1 rounded-lg text-xs font-bold border",
                                        item.sentiment_label === 'POSITIVE' && "bg-green-500/10 border-green-500/20 text-green-400",
                                        item.sentiment_label === 'NEGATIVE' && "bg-red-500/10 border-red-500/20 text-red-400",
                                        item.sentiment_label === 'NEUTRAL' && "bg-slate-500/10 border-slate-500/20 text-slate-400",
                                    )}>
                                        {item.sentiment_label}
                                    </div>
                                </div>
                            </motion.a>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-10 text-gray-500">
                            Tidak ada berita yang cocok dengan "{searchQuery}"
                        </div>
                    )
                )}
            </div>
        </section>
    );
}
