'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface IHSGData {
    symbol: string;
    name: string;
    price: number;
    change: number;
    change_pct: number;
    history: { date: string; value: number }[];
}

export default function MarketIndexChart() {
    const [data, setData] = useState<IHSGData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/stocks/ihsg');
                setData(res.data);
            } catch (error) {
                console.error("Failed to fetch IHSG data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="w-full h-64 bg-white/5 rounded-2xl animate-pulse" />;
    if (!data) return null;

    const isPositive = data.change >= 0;

    return (
        <section className="w-full max-w-7xl mx-auto px-6 mb-8">
            <div className="w-full p-6 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Activity className="text-cyan-400" size={20} />
                            <h2 className="text-lg font-bold text-gray-200">IHSG (Composite Index)</h2>
                        </div>
                        <div className="flex items-end gap-3">
                            <span className="text-3xl font-bold text-white">
                                {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(data.price)}
                            </span>
                            <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                <span>{data.change > 0 ? '+' : ''}{data.change.toFixed(2)} ({data.change_pct.toFixed(2)}%)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.history}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isPositive ? "#4ade80" : "#f87171"} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={isPositive ? "#4ade80" : "#f87171"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                hide
                            />
                            <YAxis
                                domain={['auto', 'auto']}
                                hide
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number | undefined) => [new Intl.NumberFormat('id-ID').format(value || 0), 'Value']}
                                labelStyle={{ display: 'none' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={isPositive ? "#4ade80" : "#f87171"}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </section>
    );
}
