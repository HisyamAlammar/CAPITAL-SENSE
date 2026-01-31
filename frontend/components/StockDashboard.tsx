'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Trophy, Star, Bell, Activity } from 'lucide-react';
import Link from 'next/link';
import MarketRecap from './MarketRecap';
import ComparisonModal from './ComparisonModal';
import AIPicks from './AIPicks';

export interface Stock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    change_pct: number;
    status: 'up' | 'down' | 'neutral';
    marketCap: number;
    volume?: number;
    sector?: string;
}

type TabType = 'all' | 'gainers' | 'losers' | 'bigcap';

export default function StockDashboard({ simpleView = false }: { simpleView?: boolean }) {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType | 'favorites'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // New Features States
    const [selectedSector, setSelectedSector] = useState('All');
    const [selectedForCompare, setSelectedForCompare] = useState<Stock[]>([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

    // Watchlist State
    const [favorites, setFavorites] = useState<string[]>([]);
    const [targets, setTargets] = useState<{ [key: string]: number }>({});

    // Load Watchlist
    useEffect(() => {
        const savedFavs = localStorage.getItem('favorites');
        const savedTargets = localStorage.getItem('targets');
        if (savedFavs) setFavorites(JSON.parse(savedFavs));
        if (savedTargets) setTargets(JSON.parse(savedTargets));
    }, []);

    // Save Watchlist
    useEffect(() => {
        localStorage.setItem('favorites', JSON.stringify(favorites));
        localStorage.setItem('targets', JSON.stringify(targets));
    }, [favorites, targets]);

    const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setFavorites(prev =>
            prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
        );
    };

    const updateTarget = (symbol: string, price: number) => {
        setTargets(prev => ({ ...prev, [symbol]: price }));
    };

    useEffect(() => {
        const fetchStocks = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/stocks/`);
                setStocks(res.data);
            } catch (error) {
                console.error("Failed to fetch stocks", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStocks();
        const interval = setInterval(fetchStocks, 30000);
        return () => clearInterval(interval);
    }, []);

    // Extract unique sectors
    const sectors = ['All', ...Array.from(new Set(stocks.map(s => s.sector || 'Others')))];

    const getFilteredStocks = () => {
        let filtered = [...stocks];

        if (!simpleView) {
            // Search Filter
            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase();
                filtered = filtered.filter(s =>
                    s.symbol.toLowerCase().includes(lowerQuery) ||
                    s.name.toLowerCase().includes(lowerQuery)
                );
            }

            // Sector Filter
            if (selectedSector !== 'All') {
                filtered = filtered.filter(s => (s.sector || 'Others') === selectedSector);
            }

            if (activeTab === 'gainers') return filtered.filter(s => s.change_pct > 0).sort((a, b) => b.change_pct - a.change_pct);
            if (activeTab === 'losers') return filtered.filter(s => s.change_pct < 0).sort((a, b) => a.change_pct - b.change_pct);
            if (activeTab === 'bigcap') return filtered.sort((a, b) => b.marketCap - a.marketCap);
            if (activeTab === 'favorites') return filtered.filter(s => favorites.includes(s.symbol));
        }

        return filtered;
    };

    const filteredData = getFilteredStocks();
    const displayData = simpleView ? filteredData.slice(0, 4) : filteredData;

    // External Search Logic
    const [externalStock, setExternalStock] = useState<Stock | null>(null);
    const [isSearchingExternal, setIsSearchingExternal] = useState(false);

    const handleGlobalSearch = async () => {
        if (!searchQuery) return;
        setIsSearchingExternal(true);
        setExternalStock(null);
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/stocks/search?q=${searchQuery}`);
            if (res.data && res.data.length > 0) {
                setExternalStock(res.data[0]);
            }
        } catch (error) {
            console.error("Global search failed", error);
        } finally {
            setIsSearchingExternal(false);
        }
    };

    // Toggle Compare Logic
    const toggleCompare = (stock: Stock, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (selectedForCompare.find(s => s.symbol === stock.symbol)) {
            setSelectedForCompare(prev => prev.filter(s => s.symbol !== stock.symbol));
        } else {
            if (selectedForCompare.length >= 3) {
                alert("Maksimal 3 saham untuk dibandingkan.");
                return;
            }
            setSelectedForCompare(prev => [...prev, stock]);
        }
    };

    return (
        <section id="dashboard" className="w-full max-w-7xl mx-auto px-6 py-10 scroll-mt-24 relative">
            {/* Floating Compare Button */}
            <AnimatePresence>
                {!simpleView && selectedForCompare.length > 0 && (
                    <motion.button
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        onClick={() => setIsCompareModalOpen(true)}
                        className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:scale-105 transition-transform"
                    >
                        <Trophy size={20} /> {/* Using Trophy as BarChart placeholder if BarChart3 not imported yet, ideally import BarChart3 */}
                        Bandingkan ({selectedForCompare.length})
                    </motion.button>
                )}
            </AnimatePresence>

            <ComparisonModal
                isOpen={isCompareModalOpen}
                onClose={() => setIsCompareModalOpen(false)}
                selectedStocks={selectedForCompare}
                onRemove={(stock) => setSelectedForCompare(prev => prev.filter(s => s.symbol !== stock.symbol))}
            />

            {/* AI Market Recap (Show only in full view) */}
            {!simpleView && <MarketRecap />}

            {/* AI Top Picks (Show only in full view) */}
            {!simpleView && <AIPicks />}

            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 ${simpleView ? 'mb-4' : ''}`}>
                <div className="flex flex-col gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="text-cyan-400" size={28} />
                        <h2 className="text-2xl font-bold">{simpleView ? "Sekilas Pasar" : "Top Market Movers"}</h2>
                    </div>

                    {/* Search Bar - Hide in Simple View */}
                    {!simpleView && (
                        <div className="flex gap-2 flex-wrap">
                            <div className="relative w-full md:w-60">
                                <input
                                    type="text"
                                    placeholder="Cari emiten (e.g. BUMI, BBCA)..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setExternalStock(null); // Reset external on type
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleGlobalSearch();
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors pl-10"
                                />
                                <Activity className="absolute left-3 top-2.5 text-gray-500" size={16} />
                            </div>

                            {/* Sector Filter Dropdown */}
                            <div className="relative">
                                {/* Using Trophy as placeholder icon for Filter if Filter not imported, but wait, I can import Filter */}
                                <Star className="absolute left-3 top-2.5 text-gray-500" size={16} />
                                <select
                                    value={selectedSector}
                                    onChange={(e) => setSelectedSector(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 pl-10 text-white focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors min-w-[150px]"
                                >
                                    {sectors.map(sector => (
                                        <option key={sector} value={sector} className="bg-[#12141c] text-white">
                                            {sector}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabs - Hide in Simple View */}
                {!simpleView && (
                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5 overflow-x-auto self-start md:self-auto">
                        {['all', 'gainers', 'losers', 'bigcap', 'favorites'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                        ${activeTab === tab ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                            >
                                {tab === 'all' && 'Semua'}
                                {tab === 'gainers' && '🚀 Top Gainers'}
                                {tab === 'losers' && '🔻 Top Losers'}
                                {tab === 'bigcap' && '💎 Big Cap'}
                                {tab === 'favorites' && '⭐ Watchlist'}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {/* Display External Search Result if any */}
                        {externalStock && (
                            <Link key={externalStock.symbol} href={`/stock/${externalStock.symbol}`}>
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="glass-panel p-6 rounded-2xl bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20 transition-colors cursor-pointer group h-full border-t"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-xs font-bold text-cyan-400 mb-1 uppercase tracking-wider">Hasil Pencarian</div>
                                            <h3 className="text-lg font-bold group-hover:text-cyan-400 transition-colors flex items-center gap-1">
                                                {externalStock.symbol}
                                            </h3>
                                            <p className="text-xs text-gray-400 truncate max-w-[150px]">{externalStock.name}</p>
                                            {externalStock.sector && <p className="text-[10px] text-gray-500 mt-1">{externalStock.sector}</p>}
                                        </div>
                                        {externalStock.status === 'up' ? <ArrowUpRight className="text-green-400" /> : <ArrowDownRight className="text-red-400" />}
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <span className="text-2xl font-bold tracking-wider">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(externalStock.price)}
                                        </span>
                                    </div>
                                </motion.div>
                            </Link>
                        )}

                        {/* If local search empty and no external result, show CTA */}
                        {!simpleView && filteredData.length === 0 && !externalStock && searchQuery && (
                            <div className="col-span-full flex flex-col items-center justify-center py-10 text-center">
                                <p className="text-gray-400 mb-4">Emiten tidak ditemukan di list populer.</p>
                                <button
                                    onClick={handleGlobalSearch}
                                    disabled={isSearchingExternal}
                                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
                                >
                                    {isSearchingExternal ? 'Mencari di Global Market...' : `Cari "${searchQuery}" di Seluruh Bursa`}
                                </button>
                            </div>
                        )}

                        {displayData.map((stock, i) => {
                            const isSelected = selectedForCompare.some(s => s.symbol === stock.symbol);
                            return (
                                <div key={stock.symbol} className="relative group">
                                    {/* Compare Checkbox */}
                                    {!simpleView && (
                                        <button
                                            onClick={(e) => toggleCompare(stock, e)}
                                            className={`absolute top-4 right-4 z-20 transition-all ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                            title="Bandingkan Saham"
                                        >
                                            {isSelected ? (
                                                <div className="p-1 rounded bg-cyan-500 text-black"><TrendingUp size={16} /></div>
                                            ) : (
                                                <div className="p-1 rounded bg-gray-700/50 hover:bg-white text-gray-400 hover:text-black"><TrendingUp size={16} /></div>
                                            )}
                                        </button>
                                    )}

                                    <Link href={`/stock/${stock.symbol}`}>
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                            className={`glass-panel p-6 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer group h-full border-t border-t-white/10 ${isSelected ? 'border-cyan-500 ring-1 ring-cyan-500 bg-cyan-500/5' : ''}`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold group-hover:text-cyan-400 transition-colors flex items-center gap-1">
                                                        {stock.symbol}
                                                        {!simpleView && activeTab === 'bigcap' && <Trophy size={12} className="text-yellow-500" />}
                                                        {/* Visual Alert if Target Hit */}
                                                        {!simpleView && targets[stock.symbol] && stock.price >= targets[stock.symbol] && (
                                                            <div className="animate-bounce p-1 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.6)]">
                                                                <Bell size={12} className="text-white fill-white" />
                                                            </div>
                                                        )}
                                                    </h3>
                                                    <p className="text-xs text-gray-400 truncate max-w-[150px]">{stock.name}</p>
                                                    {!simpleView && stock.sector && <p className="text-[10px] text-gray-500 mt-1">{stock.sector}</p>}
                                                </div>
                                                <div className="flex gap-2">
                                                    {/* Star Button */}
                                                    {!simpleView && (
                                                        <button
                                                            onClick={(e) => toggleFavorite(stock.symbol, e)}
                                                            className={`p-2 rounded-full transition-all ${favorites.includes(stock.symbol) ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-600 hover:text-yellow-400 hover:bg-white/5'}`}
                                                        >
                                                            <Star size={18} fill={favorites.includes(stock.symbol) ? "currentColor" : "none"} />
                                                        </button>
                                                    )}
                                                    {stock.status === 'up' ? (
                                                        <div className="p-2 rounded-full bg-green-500/10 text-green-400">
                                                            <ArrowUpRight size={20} />
                                                        </div>
                                                    ) : stock.status === 'down' ? (
                                                        <div className="p-2 rounded-full bg-red-500/10 text-red-400">
                                                            <ArrowDownRight size={20} />
                                                        </div>
                                                    ) : (
                                                        <div className="p-2 rounded-full bg-slate-500/10 text-slate-400">
                                                            <Activity size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-end justify-between">
                                                    <span className="text-2xl font-bold tracking-wider">
                                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stock.price)}
                                                    </span>
                                                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${stock.status === 'up' ? 'text-green-400 bg-green-500/10' : stock.status === 'down' ? 'text-red-400 bg-red-500/10' : 'text-slate-400 bg-slate-500/10'}`}>
                                                        {stock.change_pct > 0 ? '+' : ''}{stock.change_pct}%
                                                    </span>
                                                </div>

                                                {/* Target Price Input (Only in Favorites Tab) */}
                                                {!simpleView && activeTab === 'favorites' && (
                                                    <div
                                                        className="mt-2 pt-2 border-t border-white/5"
                                                        onClick={(e) => e.stopPropagation()} // Prevent clicking input from navigating
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Bell size={12} className={targets[stock.symbol] ? "text-cyan-400" : "text-gray-600"} />
                                                            <input
                                                                type="number"
                                                                placeholder="Set Target Harga..."
                                                                className="bg-transparent text-xs text-white placeholder-gray-600 focus:outline-none w-full"
                                                                value={targets[stock.symbol] || ''}
                                                                onChange={(e) => updateTarget(stock.symbol, parseFloat(e.target.value))}
                                                            />
                                                        </div>
                                                        {targets[stock.symbol] && (
                                                            <div className="text-[10px] text-gray-500 mt-1">
                                                                Alert jika harga &ge; {new Intl.NumberFormat('id-ID').format(targets[stock.symbol])}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </Link>
                                </div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}
        </section>
    );
}
