'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Newspaper, Zap, ArrowRight, Loader } from 'lucide-react';
import Link from 'next/link';

interface Signal {
    technical: string;
    fundamental: string;
    sentiment: string;
}

interface AIPick {
    symbol: string;
    price: number;
    prediction: string;
    confidence: string;
    target_price: number;
    signals: Signal;
}

export default function AIPicks() {
    const [picks, setPicks] = useState<{ buys: AIPick[], sells: AIPick[], hidden_gems: AIPick[] }>({ buys: [], sells: [], hidden_gems: [] });
    const [activeTab, setActiveTab] = useState<'gems' | 'flags' | 'hidden'>('gems');
    const [loading, setLoading] = useState(true);

    // IPO State
    const [ipoNews, setIpoNews] = useState<any[]>([]);
    const [loadingIpo, setLoadingIpo] = useState(true);

    const fetchPicks = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/analysis/top-picks`);
            setPicks(res.data);
        } catch (error) {
            console.error("Failed to fetch top picks", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchIpoNews = async () => {
        setLoadingIpo(true);
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/analysis/ipo-rumors`);
            setIpoNews(res.data);
        } catch (error) {
            console.error("Failed to fetch IPO news", error);
        } finally {
            setLoadingIpo(false);
        }
    };

    useEffect(() => {
        fetchPicks();
        fetchIpoNews();
    }, []);

    const getSignalColor = (text: string) => {
        if (text.includes("BULLISH") || text.includes("STRONG") || text.includes("GOOD")) return "text-green-400";
        if (text.includes("BEARISH") || text.includes("WEAK")) return "text-red-400";
        return "text-yellow-400";
    };

    const getCardStyle = (prediction: string) => {
        if (prediction.includes("STRONG BUY")) return "from-green-500/20 to-emerald-500/10 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]";
        if (prediction.includes("BUY")) return "from-green-500/10 to-emerald-500/5 border-green-500/30";
        if (prediction.includes("STRONG SELL")) return "from-red-500/20 to-rose-500/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]";
        if (prediction.includes("SELL")) return "from-red-500/10 to-rose-500/5 border-red-500/30";
        return "from-yellow-500/10 to-amber-500/5 border-yellow-500/30";
    };

    const displayData = activeTab === 'gems' ? picks.buys : activeTab === 'hidden' ? picks.hidden_gems : picks.sells;

    return (
        <section className="w-full max-w-7xl mx-auto px-6 mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-3">
                    <Zap className={activeTab === 'flags' ? "text-red-500" : activeTab === 'hidden' ? "text-purple-400" : "text-yellow-400"} size={28} />
                    <div>
                        <h2 className="text-2xl font-bold">
                            {activeTab === 'gems' ? "Hidden Gems (Pilihan AI)" :
                                activeTab === 'hidden' ? "Very Hidden Gems (Small Cap)" :
                                    "Red Flags (Sinyal Jual)"}
                        </h2>
                        <p className="text-sm text-gray-400">
                            {activeTab === 'gems' ? "Saham potensial dengan sinyal teknikal & fundamental kuat." :
                                activeTab === 'hidden' ? "Saham kapitalisasi kecil namun berpotensi meledak." :
                                    "Saham yang sebaiknya dihindari saat ini menurut analisis AI."}
                        </p>
                    </div>
                </div>

                {/* Toggle Switch */}
                <div className="flex bg-white/5 p-1 rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
                    <button
                        onClick={() => setActiveTab('gems')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'gems' ? 'bg-green-500/20 text-green-400 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        💎 Gems
                    </button>
                    <button
                        onClick={() => setActiveTab('hidden')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'hidden' ? 'bg-purple-500/20 text-purple-400 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        🔮 Very Hidden
                    </button>
                    <button
                        onClick={() => setActiveTab('flags')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'flags' ? 'bg-red-500/20 text-red-400 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        🚩 Red Flags
                    </button>
                    <button onClick={fetchPicks} className="px-3 py-2 ml-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <Loader size={16} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : displayData.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5 border-dashed mb-12">
                    <p className="text-gray-400">
                        {activeTab === 'hidden' ? "Belum ada Small Cap Gems yang ditemukan dengan kriteria ketat ini." : "Tidak ada data untuk kategori ini."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {displayData.map((pick, i) => (
                        <Link href={`/stock/${pick.symbol}`} key={pick.symbol}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`h-full relative overflow-hidden rounded-2xl p-6 border bg-gradient-to-br ${getCardStyle(pick.prediction)} hover:scale-[1.02] transition-transform cursor-pointer group`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-xs font-bold bg-white/10 px-2 py-1 rounded w-fit mb-2 text-white">
                                            Confidence: {pick.confidence}
                                        </div>
                                        <h3 className="text-2xl font-bold group-hover:text-cyan-400 transition-colors">{pick.symbol}</h3>
                                        <p className="text-sm text-gray-400">Target: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(pick.target_price)}</p>
                                    </div>
                                    <div className={`text-xl font-black px-3 py-1 rounded-lg bg-black/30 backdrop-blur whitespace-nowrap ${pick.prediction.includes("BUY") ? "text-green-400" : pick.prediction.includes("SELL") ? "text-red-400" : "text-yellow-400"}`}>
                                        {pick.prediction}
                                    </div>
                                </div>

                                {/* 3 Pillars Layout */}
                                <div className="space-y-3 mt-4">
                                    {/* 1. Technical */}
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-1.5 rounded bg-blue-500/20 text-blue-400">
                                            <TrendingUp size={14} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs text-gray-500">Teknikal</div>
                                            <div className={`font-medium ${getSignalColor(pick.signals.technical)}`}>
                                                {pick.signals.technical.split('(')[0]}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Fundamental */}
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-1.5 rounded bg-purple-500/20 text-purple-400">
                                            <BarChart3 size={14} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs text-gray-500">Fundamental</div>
                                            <div className={`font-medium ${getSignalColor(pick.signals.fundamental)}`}>
                                                {pick.signals.fundamental.split('(')[0]}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Sentiment */}
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-1.5 rounded bg-orange-500/20 text-orange-400">
                                            <Newspaper size={14} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs text-gray-500">Sentimen</div>
                                            <div className={`font-medium ${getSignalColor(pick.signals.sentiment)}`}>
                                                {pick.signals.sentiment.split('(')[0]}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {activeTab === 'flags' && (
                                    <div className="mt-4 pt-4 border-t border-red-500/20 text-xs text-red-300 italic flex items-center gap-1">
                                        <Zap size={12} className="text-red-500" />
                                        High Risk: Bukan untuk investasi jangka panjang
                                    </div>
                                )}

                                {activeTab === 'hidden' && (
                                    <div className="mt-4 pt-4 border-t border-purple-500/20 text-xs text-purple-300 italic flex items-center gap-1">
                                        <Zap size={12} className="text-purple-500" />
                                        Small Cap: Potensi gain tinggi, volatilitas tinggi
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-end text-xs text-gray-500 group-hover:text-white transition-colors items-center gap-1">
                                    Lihat Detail Analisis <ArrowRight size={12} />
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            )}

            {/* IPO Rumor Section - Integrated here for simplicity based on dashboard layout */}
            <div className="border-t border-white/5 pt-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <Newspaper size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Rumor & Berita IPO Terkini</h2>
                        <p className="text-xs text-gray-400">Informasi potensi perusahaan yang akan segera melantai di bursa (IPO).</p>
                    </div>
                </div>

                {loadingIpo ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-24 bg-white/5 rounded-xl animate-pulse" />
                        <div className="h-24 bg-white/5 rounded-xl animate-pulse" />
                    </div>
                ) : ipoNews.length === 0 ? (
                    <div className="text-sm text-gray-500">Belum ada berita IPO terbaru yang signifikan.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ipoNews.map((news, i) => (
                            <a href={news.url} target="_blank" rel="noopener noreferrer" key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm mb-1 group-hover:text-blue-400 transition-colors line-clamp-2">{news.title}</h4>
                                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{news.description}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                        <span>{news.source}</span>
                                        <span>•</span>
                                        <span>{news.published_at}</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
