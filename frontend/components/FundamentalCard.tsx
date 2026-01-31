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
    book_value?: number;
    shares_outstanding?: number;
    float_shares?: number;
    enterprise_value?: number;
    ebitda?: number;
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

    // Advanced Analysis (New Metrics)
    // EV / EBITDA: Lower is better. < 10 is usually considered healthy/undervalued.
    const evEbitda = (data.enterprise_value && data.ebitda) ? (data.enterprise_value / data.ebitda) : 0;

    // Float Percentage: (Float / Shares Outstanding) * 100
    const floatPct = (data.float_shares && data.shares_outstanding) ? (data.float_shares / data.shares_outstanding) * 100 : 0;

    // Determine "Health Score" (Heuristic Analysis)
    let score = 0;

    // 1. Valuation (PER & EV/EBITDA)
    if (per > 0 && per < 15) score += 2; // Cheap PER
    if (evEbitda > 0 && evEbitda < 12) score += 2; // Cheap EV/EBITDA
    if (pbv < 1.5) score += 1; // Undervalued by Book Value

    // 2. Profitability (ROE)
    if (roe > 15) score += 2; // Very Profitable
    else if (roe > 10) score += 1; // Decently Profitable

    // 3. Income (Dividends)
    if (divYield > 3) score += 1; // Good Dividend

    // 4. Liquidity / Structure (Free Float)
    if (floatPct > 7.5) score += 1; // Sufficient Public Liquidity

    // Penalties
    if (evEbitda > 30) score -= 1; // Very Expensive
    if (per > 50) score -= 1; // Overvalued

    let recommendation = "NEUTRAL";
    let color = "text-yellow-400";
    let bg = "bg-yellow-400/10";

    // Adjusted thresholds for max score roughly 10
    if (score >= 6) {
        recommendation = "STRONG BUY";
        color = "text-green-400";
        bg = "bg-green-500/10";
    } else if (score >= 4) {
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

    const formatShares = (val: number) => {
        if (!val) return "-";
        if (val >= 1e9) return `${(val / 1e9).toFixed(2)} Miliar Lbr`;
        if (val >= 1e6) return `${(val / 1e6).toFixed(2)} Juta Lbr`;
        return `${val.toLocaleString('id-ID')} Lbr`;
    };

    // Reusable Metric Card with Tooltip
    const MetricCard = ({ icon: Icon, label, value, target, colorClass, tooltip, colSpan = "" }: any) => (
        <div className={`p-4 rounded-xl bg-white/5 border border-white/5 relative group ${colSpan}`}>
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-2">
                <Icon size={14} />
                {label}
                <div className="relative">
                    <Info size={12} className="opacity-50 hover:opacity-100 transition-opacity cursor-help text-cyan-400" />
                    {/* Tooltip Popup */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-gray-900 border border-white/10 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <p className="text-[10px] text-gray-300 leading-relaxed text-center">
                            {tooltip}
                        </p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
                    </div>
                </div>
            </div>
            <div className={clsx("text-lg font-bold", colorClass || "text-white")}>
                {value}
            </div>
            {target && <div className="text-[10px] text-gray-500 mt-1">{target}</div>}
        </div>
    );

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
                <MetricCard
                    icon={PieChart}
                    label="Market Cap"
                    value={formatCurrency(data.market_cap)}
                    tooltip="Nilai total seluruh saham perusahaan. Menunjukkan seberapa besar ukuran perusahaan (Big Cap vs Small Cap)."
                />

                <MetricCard
                    icon={DollarSign}
                    label="PER (Valuasi)"
                    value={per ? per.toFixed(2) + "x" : "-"}
                    target="Target: < 15x (Murah)"
                    colorClass={per > 0 && per < 15 ? "text-green-400" : "text-gray-200"}
                    tooltip="Price-to-Earnings: Membandingkan harga saham dengan laba per lembar. Semakin rendah, semakin 'murah' (undervalued)."
                />

                <MetricCard
                    icon={Scale}
                    label="PBV Ratio"
                    value={pbv ? pbv.toFixed(2) + "x" : "-"}
                    target="Target: < 1.5x (Undervalued)"
                    colorClass={pbv > 0 && pbv < 1.5 ? "text-green-400" : "text-gray-200"}
                    tooltip="Price-to-Book: Membandingkan harga saham dengan nilai aset bersih. Di bawah 1x berarti harga diskon dari asetnya."
                />

                <MetricCard
                    icon={Activity}
                    label="ROE (Profit)"
                    value={roe ? roe.toFixed(1) + "%" : "-"}
                    target="Target: > 15% (Profitable)"
                    colorClass={roe > 15 ? "text-green-400" : "text-gray-200"}
                    tooltip="Return on Equity: Seberapa efisien perusahaan menghasilkan laba dari modal pemegang saham. Di atas 15% sangat bagus."
                />

                <MetricCard
                    icon={DollarSign}
                    label="Dividend Yield"
                    value={divYield ? divYield.toFixed(2) + "% / tahun" : "-"}
                    colSpan="col-span-2 lg:col-span-4"
                    tooltip="Persentase keuntungan tunai yang dibagikan perusahaan kepada investor setiap tahunnya (relatif terhadap harga saham)."
                />

                <MetricCard
                    icon={Scale}
                    label="Book Value"
                    value={data.book_value ? formatCurrency(data.book_value) : "-"}
                    tooltip="Nilai buku per lembar saham. Jika harga saham di bawah nilai ini, secara teoritis saham tersebut undervalued (PBV < 1)."
                />

                <MetricCard
                    icon={PieChart}
                    label="Shares Outstanding"
                    value={data.shares_outstanding ? formatShares(data.shares_outstanding) : "-"}
                    tooltip="Jumlah total saham yang beredar di pasar."
                />

                <MetricCard
                    icon={Activity}
                    label="Free Float"
                    value={data.float_shares && data.shares_outstanding ? `${((data.float_shares / data.shares_outstanding) * 100).toFixed(2)}%` : "-"}
                    tooltip="Persentase saham yang beredar di pasar publik (Masyarakat) dibandingkan total saham. Semakin besar, semakin likuid."
                />

                <MetricCard
                    icon={DollarSign}
                    label="Enterprise Value"
                    value={data.enterprise_value ? formatCurrency(data.enterprise_value) : "-"}
                    tooltip="Nilai total perusahaan jika seseorang ingin membelinya (Kapitalisasi Pasar + Utang - Kas). Lebih akurat dari Market Cap untuk valuasi akuisisi."
                />

                <MetricCard
                    icon={Scale}
                    label="EBITDA"
                    value={data.ebitda ? formatCurrency(data.ebitda) : "-"}
                    tooltip="Laba sebelum bunga, pajak, depresiasi, dan amortisasi. Indikator kinerja operasional murni."
                />
            </div>
        </motion.div>
    );
}
