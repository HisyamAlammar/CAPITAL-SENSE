'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';

const formatIDR = (value: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export default function PortfolioPage() {
    const [holdings, setHoldings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [symbol, setSymbol] = useState('');
    const [price, setPrice] = useState('');
    const [lots, setLots] = useState('');

    const fetchPortfolio = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio/`);
            setHoldings(res.data);
        } catch (error) {
            console.error("Error fetching portfolio", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPortfolio();
    }, []);

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio/`, {
                symbol: symbol.toUpperCase(),
                price: parseFloat(price),
                lots: parseInt(lots)
            });
            setShowModal(false);
            setSymbol('');
            setPrice('');
            setLots('');
            fetchPortfolio(); // Refresh
        } catch (error) {
            alert('Failed to add transaction');
        }
    };

    const handleDelete = async (symbol: string) => {
        if (!confirm(`Are you sure you want to sell/remove ${symbol}?`)) return;
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio/${symbol}`);
            fetchPortfolio();
        } catch (error) {
            alert('Failed to delete asset');
        }
    };

    // Calculate Summary
    const totalValue = holdings.reduce((acc, item) => acc + item.total_value, 0);
    const totalInvested = holdings.reduce((acc, item) => acc + (item.avg_price * item.total_lots * 100), 0); // Approx
    // Actually backend returns precision, let's use backend if possible or calc here. 
    // Backend returns item.total_value (current) 
    // We need invested. calculating from (avg_price * lots * 100)
    // Gain Loss
    const totalGainLossValue = totalValue - totalInvested;
    const totalGainLossPct = totalInvested > 0 ? (totalGainLossValue / totalInvested) * 100 : 0;

    return (
        <main className="min-h-screen pt-24 px-6 pb-20 max-w-7xl mx-auto">
            <header className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Portfolio</h1>
                    <p className="text-gray-400">Track wealth and performance.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-2 px-4 rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                >
                    <Plus size={20} /> Add Asset
                </button>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white/5 border border-white/5 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 text-gray-400 mb-2">
                        <Wallet size={20} className="text-purple-400" /> Total Aset (Value)
                    </div>
                    <div className="text-3xl font-bold text-white tracking-wide">
                        {formatIDR(totalValue)}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/5 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 text-gray-400 mb-2">
                        <DollarSign size={20} className="text-blue-400" /> Modal Awal (Invested)
                    </div>
                    <div className="text-3xl font-bold text-gray-300 tracking-wide">
                        {formatIDR(totalInvested)}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/5 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 text-gray-400 mb-2">
                        <TrendingUp size={20} className={totalGainLossValue >= 0 ? "text-green-400" : "text-red-400"} /> Total Profit/Loss
                    </div>
                    <div className={`text-3xl font-bold tracking-wide ${totalGainLossValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {totalGainLossValue >= 0 ? '+' : ''}{formatIDR(totalGainLossValue)} <span className="text-lg opacity-80">({totalGainLossPct.toFixed(2)}%)</span>
                    </div>
                </div>
            </div>

            {/* Assets Table */}
            <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="p-6 border-b border-white/10">
                    <h3 className="font-bold text-lg">Holdings</h3>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-gray-400">Loading Market Data...</div>
                ) : holdings.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">
                        Belum ada aset. Klik "Add Asset" untuk mulai tracking.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Symbol</th>
                                    <th className="px-6 py-4 text-right">Avg Price</th>
                                    <th className="px-6 py-4 text-right">Current Price</th>
                                    <th className="px-6 py-4 text-right">Lots</th>
                                    <th className="px-6 py-4 text-right">Value</th>
                                    <th className="px-6 py-4 text-center">Gain/Loss</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {holdings.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-bold text-white">{item.symbol}</td>
                                        <td className="px-6 py-4 text-right text-gray-300">{formatIDR(item.avg_price)}</td>
                                        <td className="px-6 py-4 text-right text-yellow-200">{formatIDR(item.current_price)}</td>
                                        <td className="px-6 py-4 text-right text-gray-300">{item.total_lots} Lot</td>
                                        <td className="px-6 py-4 text-right font-bold text-white">{formatIDR(item.total_value)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.gain_loss_pct >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {item.gain_loss_pct >= 0 ? '+' : ''}{item.gain_loss_pct.toFixed(2)}%
                                            </span>
                                            <div className={`text-[10px] mt-1 ${item.gain_loss_value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {formatIDR(item.gain_loss_value)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDelete(item.symbol)}
                                                className="p-2 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1e202b] border border-white/10 p-8 rounded-3xl max-w-sm w-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold mb-6">Add Transaction</h3>
                        <form onSubmit={handleAddTransaction} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Stock Code</label>
                                <input
                                    type="text"
                                    value={symbol}
                                    onChange={e => setSymbol(e.target.value.toUpperCase())}
                                    placeholder="e.g. BBCA"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 font-bold"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Buy Price (Avg)</label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    placeholder="e.g. 5200"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Quantity (Lots)</label>
                                <input
                                    type="number"
                                    value={lots}
                                    onChange={e => setLots(e.target.value)}
                                    placeholder="e.g. 10"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 py-3 rounded-xl font-bold text-white hover:opacity-90 transition-opacity mt-4"
                            >
                                Confirm Buy
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </main>
    );
}
