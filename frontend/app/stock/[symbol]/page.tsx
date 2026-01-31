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
    const [selectedTimeframe, setSelectedTimeframe] = useState<string>("3m");

    // Fetch prediction with timeframe
    const fetchPrediction = async (timeframe: string) => {
        try {
            const predRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/analysis/prediction/${symbol}?timeframe=${timeframe}`);
            setPrediction(predRes.data);
        } catch (error) {
            console.error("Error fetching prediction", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get Stock Details (History)
                const stockRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/stocks/${symbol}`);
                setStockData(stockRes.data);

                // 2. Get Prediction (default 3m)
                await fetchPrediction(selectedTimeframe);

                // 3. Get Related News
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

    // Update prediction when timeframe changes
    useEffect(() => {
        if (symbol && !loading) {
            fetchPrediction(selectedTimeframe);
        }
    }, [selectedTimeframe]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-cyan-400">Loading Intelligence...</div>;

    return (
        <main className="min-h-screen relative z-10 pt-20 px-6 pb-20">
            <Link href="/market" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group">
                <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                    <ArrowLeft size={20} />
                </div>
                <span className="font-medium">Balik ke Dashboard</span>
            </Link>

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4 max-w-7xl mx-auto">
                <div>
                    <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
                        {symbol}
                    </h1>
                    <p className="text-xl text-gray-400 mb-3">{stockData?.info?.longName}</p>
                    {stockData?.sector && (
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/5 text-sm text-cyan-300">
                            Sektor: {stockData.sector}
                        </div>
                    )}

                    {/* Stock Identity Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-4">
                        {/* Industry */}
                        {stockData?.industry && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/5 text-xs">
                                <span className="text-gray-400">Industri:</span>
                                <span className="text-purple-300 font-medium">{stockData.industry}</span>
                            </div>
                        )}

                        {/* Beta */}
                        {stockData?.beta && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/5 text-xs">
                                <span className="text-gray-400">⚡ Beta:</span>
                                <span className={`font-medium ${stockData.beta > 1.5 ? 'text-red-300' : stockData.beta > 1 ? 'text-yellow-300' : 'text-green-300'}`}>
                                    {stockData.beta.toFixed(2)}
                                </span>
                            </div>
                        )}

                        {/* Average Volume */}
                        {stockData?.average_volume && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/5 text-xs">
                                <span className="text-gray-400">📊 Vol:</span>
                                <span className="text-blue-300 font-medium">
                                    {stockData.average_volume >= 1e6 ? `${(stockData.average_volume / 1e6).toFixed(1)}M` : `${(stockData.average_volume / 1e3).toFixed(0)}K`}
                                </span>
                            </div>
                        )}

                        {/* IPO Date */}
                        {stockData?.ipo_date && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/5 text-xs">
                                <span className="text-gray-400">📅 IPO:</span>
                                <span className="text-pink-300 font-medium">
                                    {new Date(stockData.ipo_date * 1000).getFullYear()}
                                </span>
                            </div>
                        )}

                        {/* Website */}
                        {stockData?.website && (
                            <a
                                href={stockData.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/5 text-xs hover:bg-white/20 transition-colors group"
                            >
                                <span className="text-gray-400">🔗</span>
                                <span className="text-cyan-300 font-medium group-hover:text-cyan-200">Website</span>
                            </a>
                        )}
                    </div>

                    {/* 52-Week Range Bar */}
                    {stockData?.fifty_two_week_low && stockData?.fifty_two_week_high && prediction?.price && (
                        <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="flex justify-between items-center mb-2 text-xs">
                                <span className="text-gray-400">52-Week Range</span>
                                <span className="text-gray-500">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stockData.fifty_two_week_low)} - {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stockData.fifty_two_week_high)}
                                </span>
                            </div>
                            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-50"></div>
                                <div
                                    className="absolute top-0 h-full w-1 bg-white shadow-lg shadow-white/50"
                                    style={{
                                        left: `${((prediction.price - stockData.fifty_two_week_low) / (stockData.fifty_two_week_high - stockData.fifty_two_week_low)) * 100}%`
                                    }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center mt-1 text-[10px]">
                                <span className="text-red-400">Low</span>
                                <span className="text-white font-bold">
                                    Saat ini: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(prediction.price)}
                                </span>
                                <span className="text-green-400">High</span>
                            </div>
                        </div>
                    )}
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
                            ${prediction.prediction.includes("BUY") ? "bg-green-500/20 text-green-400 border border-green-500/50" :
                                        prediction.prediction.includes("SELL") ? "bg-red-500/20 text-red-400 border border-red-500/50" :
                                            "bg-gray-500/20 text-gray-400 border border-gray-500/50"}
                            `}
                            >
                                {prediction.prediction} ({prediction.confidence} Confidence)
                            </motion.div>

                            <button
                                onClick={() => setShowProjection(true)}
                                className="text-xs flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors border-b border-cyan-400/30 pb-0.5"
                            >
                                <TrendingUp size={14} /> Intip Proyeksi
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
                            <div className="text-gray-500 flex items-center justify-center h-full">Yah, Data Chart Kosong...</div>
                        )}
                    </div>

                    {/* Fundamental Analysis Card */}
                    {stockData && (
                        <FundamentalCard data={{
                            market_cap: stockData.market_cap,
                            pe_ratio: stockData.pe_ratio,
                            pbv_ratio: stockData.pbv_ratio,
                            roe: stockData.roe,
                            dividend_yield: stockData.dividend_yield,
                            book_value: stockData.book_value,
                            shares_outstanding: stockData.shares_outstanding,
                            float_shares: stockData.float_shares,
                            enterprise_value: stockData.enterprise_value,
                            ebitda: stockData.ebitda,
                            share_holders: stockData.share_holders
                        }} />
                    )}

                    {/* Analysis Box */}
                    <div className="glass-panel p-6 rounded-3xl">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <AlertCircle size={20} className="text-purple-400" /> Kata AI Pintar (3 Pillar)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {/* Technical */}
                            <div className="bg-white/5 p-4 rounded-xl">
                                <span className="text-gray-400 block mb-1">Teknikal (Tren Harga)</span>
                                <span className={`text-lg font-bold ${prediction?.signals?.technical?.includes('BULLISH') ? 'text-green-400' : prediction?.signals?.technical?.includes('BEARISH') ? 'text-red-400' : 'text-gray-200'}`}>
                                    {prediction?.signals?.technical?.split('(')[0] || 'NEUTRAL'}
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                    {prediction?.signals?.technical?.includes('(') ? prediction?.signals?.technical?.split('(')[1].replace(')', '') : 'Indikator Netral'}
                                </div>
                            </div>

                            {/* Fundamental */}
                            <div className="bg-white/5 p-4 rounded-xl">
                                <span className="text-gray-400 block mb-1">Fundamental (Kualitas)</span>
                                <span className={`text-lg font-bold ${prediction?.signals?.fundamental?.includes('STRONG') ? 'text-green-400' : prediction?.signals?.fundamental?.includes('WEAK') ? 'text-red-400' : 'text-gray-200'}`}>
                                    {prediction?.signals?.fundamental?.split('(')[0] || 'NEUTRAL'}
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                    {prediction?.signals?.fundamental?.includes('(') ? prediction?.signals?.fundamental?.split('(')[1].replace(')', '') : 'Data Cukup'}
                                </div>
                            </div>

                            {/* Sentiment */}
                            <div className="bg-white/5 p-4 rounded-xl">
                                <span className="text-gray-400 block mb-1">Apa Kata Berita?</span>
                                <span className={`text-lg font-bold ${prediction?.signals?.sentiment?.includes('BULLISH') ? 'text-green-400' : prediction?.signals?.sentiment?.includes('BEARISH') ? 'text-red-400' : 'text-gray-200'}`}>
                                    {prediction?.signals?.sentiment?.split('(')[0] || 'NEUTRAL'}
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                    {prediction?.signals?.sentiment?.includes('(') ? prediction?.signals?.sentiment?.split('(')[1].replace(')', '') : 'Berita Netral'}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-white/5 p-4 rounded-xl flex items-center justify-between">
                                <span className="text-gray-400">Tingkat Keyakinan AI</span>
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
                        {news.length === 0 && <p className="text-gray-500 text-sm">Belum ada berita yang pas nih.</p>}
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
                            Proyeksi Pasar ({prediction?.timeframe || "3 Bulan"})
                        </h3>

                        {/* Timeframe Toggle */}
                        <div className="flex gap-2 mb-4">
                            {["1m", "3m", "6m"].map((tf) => (
                                <button
                                    key={tf}
                                    onClick={() => setSelectedTimeframe(tf)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedTimeframe === tf
                                            ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/50"
                                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                                        }`}
                                >
                                    {tf === "1m" ? "1 Bulan" : tf === "3m" ? "3 Bulan" : "6 Bulan"}
                                </button>
                            ))}
                        </div>

                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-xs text-yellow-200 mb-6">
                            ⚠️ Disclaimer: Ini hasil simulasi AI ya, bukan dukun! Tetap Do Your Own Research (DYOR) sebelum beli/jual.
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                <span className="text-gray-400">Target Harga (AI Estimate)</span>
                                <span className={`text-3xl font-bold ${prediction.prediction.includes("BUY") ? "text-green-400" : prediction.prediction.includes("SELL") ? "text-red-400" : "text-gray-400"}`}>
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(prediction.target_price)}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <span className="text-sm text-gray-400">Analisis Pendukung:</span>
                                <ul className="list-disc pl-5 text-sm space-y-1 text-gray-300">
                                    <li>Teknikal: <span className="text-white font-medium">{prediction.signals.technical.split('(')[0]}</span></li>
                                    <li>Fundamental: <span className="text-white font-medium">{prediction.signals.fundamental.split('(')[0]}</span></li>
                                    <li>Sentimen: <span className="text-white font-medium">{prediction.signals.sentiment.split('(')[0]}</span></li>
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
