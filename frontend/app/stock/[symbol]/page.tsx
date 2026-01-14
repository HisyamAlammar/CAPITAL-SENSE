'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, AlertCircle, Newspaper } from 'lucide-react';
import Link from 'next/link';
// import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'; // Deprecated
import StockChart from '@/components/StockChart';
import FundamentalCard from '@/components/FundamentalCard';

export default function StockDetailPage() {
    const params = useParams();
    const symbol = params.symbol as string;

    const [stockData, setStockData] = useState<any>(null);
    const [prediction, setPrediction] = useState<any>(null);
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showProjection, setShowProjection] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get Stock Details (History)
                const stockRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/stocks/${symbol}`);
                setStockData(stockRes.data);

                // 2. Get Prediction
                const predRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/analysis/prediction/${symbol}`);
                setPrediction(predRes.data);

                // 3. Get Related News
                // We use the full company name or symbol for better search results
                const query = stockRes.data.info?.longName || symbol;
                const newsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/news/?q=${query}`);
                setNews(newsRes.data);

            } catch (error) {
                console.error("Error fetching detail data", error);
            } finally {
                setLoading(false);
            }
        };

        if (symbol) fetchData();
    }, [symbol]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-cyan-400">Loading Intelligence...</div>;

    return (
        <main className="min-h-screen relative z-10 pt-20 px-6 pb-20">
            <Link href="/market" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group">
                <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                    <ArrowLeft size={20} />
                </div>
                <span className="font-medium">Kembali ke Market</span>
            </Link>

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4 max-w-7xl mx-auto">
                <div>
                    <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
                        {symbol}
                    </h1>
                    <p className="text-xl text-gray-400">{stockData?.info?.longName}</p>
                </div>

                <div className="text-right">
                    <div className="text-3xl font-bold">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(prediction?.price || 0)}
                    </div>
                    {/* Prediction Badge */}
                    {prediction && (
                        <div className="flex flex-col items-end gap-2">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`inline-block px-4 py-2 rounded-xl mt-2 font-bold text-sm
                            ${prediction.prediction.includes("UP") ? "bg-green-500/20 text-green-400 border border-green-500/50" : "bg-red-500/20 text-red-400 border border-red-500/50"}
                            `}
                            >
                                {prediction.prediction} ({prediction.confidence} Confidence)
                            </motion.div>

                            <button
                                onClick={() => setShowProjection(true)}
                                className="text-xs flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors border-b border-cyan-400/30 pb-0.5"
                            >
                                <TrendingUp size={14} /> Lihat Proyeksi 3 Bulan
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Area */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-panel p-6 rounded-3xl h-[450px]">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <TrendingUp size={20} className="text-cyan-400" /> Chart Interaktif (Candlestick)
                        </h3>
                        {stockData?.history?.length > 0 ? (
                            <StockChart data={stockData.history} />
                        ) : (
                            <div className="text-gray-500 flex items-center justify-center h-full">Data Chart Tidak Tersedia</div>
                        )}
                    </div>

                    {/* Fundamental Analysis Card */}
                    {stockData && (
                        <FundamentalCard data={{
                            market_cap: stockData.market_cap,
                            pe_ratio: stockData.pe_ratio,
                            pbv_ratio: stockData.pbv_ratio,
                            roe: stockData.roe,
                            dividend_yield: stockData.dividend_yield
                        }} />
                    )}

                    {/* Analysis Box */}
                    <div className="glass-panel p-6 rounded-3xl">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <AlertCircle size={20} className="text-purple-400" /> Analisis Smart AI (Tech + Fundamental)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {/* Technical */}
                            <div className="bg-white/5 p-4 rounded-xl">
                                <span className="text-gray-400 block mb-1">Teknikal (MA Cross)</span>
                                <span className={`text-lg font-bold ${prediction?.signals?.technical === 'BULLISH' ? 'text-green-400' : prediction?.signals?.technical === 'BEARISH' ? 'text-red-400' : 'text-gray-200'}`}>
                                    {prediction?.signals?.technical}
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                    MA5: {prediction?.signals?.ma_5} | MA20: {prediction?.signals?.ma_20}
                                </div>
                            </div>

                            {/* Micro */}
                            <div className="bg-white/5 p-4 rounded-xl">
                                <span className="text-gray-400 block mb-1">Fundamental (Micro)</span>
                                <span className={`text-lg font-bold ${prediction?.signals?.micro?.includes('STRONG') ? 'text-green-400' : prediction?.signals?.micro?.includes('WEAK') ? 'text-red-400' : 'text-gray-200'}`}>
                                    {prediction?.signals?.micro?.split('(')[0] || 'NEUTRAL'}
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                    {prediction?.signals?.micro?.includes('(') ? prediction?.signals?.micro?.split('(')[1].replace(')', '') : 'Valuasi Wajar'}
                                </div>
                            </div>

                            {/* Macro */}
                            <div className="bg-white/5 p-4 rounded-xl">
                                <span className="text-gray-400 block mb-1">Market Trend (Macro)</span>
                                <span className={`text-lg font-bold ${prediction?.signals?.macro?.includes('bullish') ? 'text-green-400' : prediction?.signals?.macro?.includes('bearish') ? 'text-red-400' : 'text-gray-200'}`}>
                                    {prediction?.signals?.macro?.split('(')[0].toUpperCase() || 'NEUTRAL'}
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                    {prediction?.signals?.macro?.includes('(') ? prediction?.signals?.macro?.split('(')[1].replace(')', '') : 'Sentimen Pasar'}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-white/5 p-4 rounded-xl flex items-center justify-between">
                                <span className="text-gray-400">Confidence Score</span>
                                <span className="text-2xl font-bold text-cyan-400">{prediction?.confidence}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Side News Panel */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Newspaper size={20} className="text-pink-400" /> Berita Terkait
                    </h3>

                    <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                        {news.map((item, i) => (
                            <motion.a
                                key={i}
                                href={item.link}
                                target="_blank"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="block bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 group transition-colors"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded
                                    ${item.sentiment_label === 'POSITIVE' ? 'bg-green-500/20 text-green-400' :
                                            item.sentiment_label === 'NEGATIVE' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}
                                `}>
                                        {item.sentiment_label}
                                    </span>
                                    <span className="text-[10px] text-gray-500">{item.source}</span>
                                </div>
                                <h4 className="text-sm font-medium leading-relaxed group-hover:text-cyan-400 transition-colors">
                                    {item.title}
                                </h4>
                                {item.description && (
                                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                        {item.description}
                                    </p>
                                )}
                            </motion.a>
                        ))}
                        {news.length === 0 && <p className="text-gray-500 text-sm">Tidak ada berita spesifik ditemukan.</p>}
                    </div>
                </div>
            </div>

            {/* Projection Modal */}
            {showProjection && prediction && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowProjection(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#12141c] border border-white/10 p-8 rounded-3xl max-w-lg w-full relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => setShowProjection(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>

                        <h3 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                            Proyeksi Pasar (3 Bulan)
                        </h3>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-xs text-yellow-200 mb-6">
                            ⚠️ Disclaimer: Proyeksi ini adalah simulasi berdasarkan tren MA20 dan Sentimen saat ini. Bukan saran finansial.
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                <span className="text-gray-400">Target Harga (Estimasi)</span>
                                <span className="text-xl font-bold text-white">
                                    {prediction.prediction.includes("UP")
                                        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(prediction.price * 1.08)
                                        : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(prediction.price * 0.92)
                                    }
                                </span>
                            </div>

                            <div className="space-y-2">
                                <span className="text-sm text-gray-400">Analisis Pendukung:</span>
                                <ul className="list-disc pl-5 text-sm space-y-1 text-gray-300">
                                    <li>Tren Jangka Pendek: <span className="text-white font-medium">{prediction.signals.technical}</span></li>
                                    <li>Sentimen Berita & Valuasi: <span className="text-white font-medium">{prediction.signals.micro.split('(')[0]}</span></li>
                                    <li>Kondisi IHSG: <span className="text-white font-medium">{prediction.signals.macro.split('(')[0]}</span></li>
                                </ul>
                            </div>

                            <div className="pt-4">
                                <button onClick={() => setShowProjection(false)} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors">
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </main>
    );
}
