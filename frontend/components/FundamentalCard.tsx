import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity, PieChart, Info, Scale } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface Fundamentals {
    market_cap: number;
    pe_ratio?: number;
    pbv_ratio?: number;
    roe?: number;
    dividend_yield?: number;
}

interface FundamentalCardProps {
    data: Fundamentals;
}

export default function FundamentalCard({ data }: FundamentalCardProps) {
    // Basic Analysis Logic
    const per = data.pe_ratio || 0;
    const roe = (data.roe || 0) * 100;
    const pbv = data.pbv_ratio || 0;
    const divYield = (data.dividend_yield || 0) * 100;

    // Determine "Health Score" (Simple Heuristic for Demo)
    let score = 0;
    if (per > 0 && per < 15) score += 2; // Cheap
    if (roe > 15) score += 2; // Profitable
    if (divYield > 3) score += 1; // Good Dividend
    if (pbv < 1.5) score += 1; // Undervalued by Book Value

    let recommendation = "NEUTRAL";
    let color = "text-yellow-400";
    let bg = "bg-yellow-400/10";

    if (score >= 4) {
        recommendation = "STRONG BUY";
        color = "text-green-400";
        bg = "bg-green-500/10";
    } else if (score === 3) {
        recommendation = "BUY";
        color = "text-green-400";
        bg = "bg-green-500/10";
    } else if (score <= 1) {
        recommendation = "SELL";
        color = "text-red-400";
        bg = "bg-red-500/10";
    }

    const formatCurrency = (val: number) => {
        if (!val) return "-";
        if (val >= 1e12) return `Rp ${(val / 1e12).toFixed(2)} T`;
        if (val >= 1e9) return `Rp ${(val / 1e9).toFixed(2)} M`;
        return `Rp ${val.toLocaleString('id-ID')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-6 backdrop-blur-sm"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Scale className="text-purple-400" size={24} />
                    <h2 className="text-xl font-bold">Analisa Fundamental</h2>
                </div>

                {/* AI Recommendation Badge */}
                <div className={clsx("px-4 py-2 rounded-xl font-bold border border-white/5 tracking-wider flex items-center gap-2", bg, color)}>
                    {recommendation === 'STRONG BUY' && <TrendingUp size={18} />}
                    {recommendation === 'SELL' && <TrendingDown size={18} />}
                    {recommendation}
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Market Cap */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-2">
                        <PieChart size={14} />
                        Market Cap
                    </div>
                    <div className="text-lg font-bold text-white">
                        {formatCurrency(data.market_cap)}
                    </div>
                </div>

                {/* PER (Price to Earnings) */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 relative group">
                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-2">
                        <DollarSign size={14} />
                        PER (Valuasi)
                        <Info size={12} className="opacity-50 group-hover:opacity-100 transition-opacity cursor-help" />
                    </div>
                    <div className={clsx("text-lg font-bold", per > 0 && per < 15 ? "text-green-400" : "text-gray-200")}>
                        {per ? per.toFixed(2) + "x" : "-"}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">Target: &lt; 15x (Murah)</div>
                </div>

                {/* PBV (Price to Book) */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-2">
                        <Scale size={14} />
                        PBV Ratio
                    </div>
                    <div className={clsx("text-lg font-bold", pbv > 0 && pbv < 1.5 ? "text-green-400" : "text-gray-200")}>
                        {pbv ? pbv.toFixed(2) + "x" : "-"}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">Target: &lt; 1.5x (Undervalued)</div>
                </div>

                {/* ROE (Return on Equity) */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-2">
                        <Activity size={14} />
                        ROE (Profit)
                    </div>
                    <div className={clsx("text-lg font-bold", roe > 15 ? "text-green-400" : "text-gray-200")}>
                        {roe ? roe.toFixed(1) + "%" : "-"}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">Target: &gt; 15% (Profitable)</div>
                </div>

                {/* Dividend Yield */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 col-span-2 lg:col-span-4 flex items-center justify-between">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-1">
                            Dividend Yield
                        </div>
                        <div className={clsx("text-xl font-bold", divYield > 4 ? "text-green-400" : "text-white")}>
                            {divYield ? divYield.toFixed(2) + "%" : "-"} / tahun
                        </div>
                    </div>
                    <div className="text-right text-xs text-gray-500 max-w-[200px]">
                        Dividen adalah bagi hasil keuntungan perusahaan kepada investor.
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
