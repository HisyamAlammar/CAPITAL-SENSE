'use client';

import { motion } from 'framer-motion';
import { Stock } from './StockDashboard';
import { X, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface ComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedStocks: Stock[];
    onRemove: (stock: Stock) => void;
}

export default function ComparisonModal({ isOpen, onClose, selectedStocks, onRemove }: ComparisonModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#12141c] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        Perbandingan Saham
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                    {selectedStocks.length === 0 ? (
                        <div className="text-center text-gray-500 py-20">
                            Belum ada saham yang dipilih untuk dibandingkan.
                        </div>
                    ) : (
                        <div className="grid grid-cols-[150px_repeat(3,1fr)] gap-4 min-w-[600px]">
                            {/* Header Column (Metrics) */}
                            <div className="space-y-6 pt-20 text-gray-400 text-sm font-medium">
                                <div className="h-10 flex items-center">Harga Terakhir</div>
                                <div className="h-10 flex items-center">Perubahan Harian</div>
                                <div className="h-10 flex items-center">Market Cap</div>
                                <div className="h-10 flex items-center">Sektor</div>
                                <div className="h-10 flex items-center">Volume</div>
                            </div>

                            {/* Stock Columns */}
                            {selectedStocks.map((stock) => {
                                const isPositive = stock.change >= 0;
                                return (
                                    <div key={stock.symbol} className="space-y-6 relative group">
                                        <button
                                            onClick={() => onRemove(stock)}
                                            className="absolute -top-2 -right-2 p-1 bg-red-500/20 text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                        >
                                            <X size={12} />
                                        </button>

                                        {/* Header Card */}
                                        <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5 h-20 flex flex-col items-center justify-center">
                                            <div className="font-bold text-lg text-white">{stock.symbol}</div>
                                            <div className="text-xs text-gray-400 truncate w-full">{stock.name}</div>
                                        </div>

                                        {/* Metrics */}
                                        <div className="h-10 flex items-center justify-center font-bold text-lg">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stock.price)}
                                        </div>

                                        <div className={clsx("h-10 flex items-center justify-center font-bold", isPositive ? "text-green-400" : "text-red-400")}>
                                            {isPositive ? '+' : ''}{stock.change_pct}%
                                        </div>

                                        <div className="h-10 flex items-center justify-center text-gray-300">
                                            {new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short' }).format(stock.marketCap || 0)}
                                        </div>

                                        <div className="h-10 flex items-center justify-center text-cyan-400 text-sm">
                                            {stock.sector || 'Unknown'}
                                        </div>

                                        <div className="h-10 flex items-center justify-center text-gray-400 text-sm">
                                            {new Intl.NumberFormat('id-ID').format(stock.volume || 0)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/10 bg-[#0f1116] flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full font-bold transition-colors">
                        Tutup
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
