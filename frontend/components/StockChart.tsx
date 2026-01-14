'use client';

import { createChart, ColorType, CandlestickSeries, LineSeries } from 'lightweight-charts';
import React, { useEffect, useRef, useState } from 'react';
import { BarChart2, Activity } from 'lucide-react';

interface ChartProps {
    data: {
        time: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume?: number;
    }[];
}

export default function StockChart({ data }: ChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [chartType, setChartType] = useState<'candle' | 'line'>('candle');

    useEffect(() => {
        if (!chartContainerRef.current || data.length === 0) return;

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#d1d5db',
            },
            width: chartContainerRef.current.clientWidth,
            height: 350,
            grid: {
                vertLines: { color: 'rgba(42, 46, 57, 0.2)' },
                horzLines: { color: 'rgba(42, 46, 57, 0.2)' },
            },
            timeScale: {
                borderColor: 'rgba(197, 203, 206, 0.2)',
                timeVisible: true,
            },
            rightPriceScale: {
                borderColor: 'rgba(197, 203, 206, 0.2)',
            },
        });

        // Common Data Prep
        const sortedData = [...data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        const uniqueData = sortedData.filter((v, i, a) => a.findIndex(t => t.time === v.time) === i);

        if (chartType === 'candle') {
            // Candlestick Series (v5 Syntax)
            const series = chart.addSeries(CandlestickSeries, {
                upColor: '#22d3ee',  // cyan-400 (Blue/Naik)
                downColor: '#ffffff', // white (Turun)
                borderVisible: false,
                wickUpColor: '#22d3ee',
                wickDownColor: '#ffffff',
            });
            series.setData(uniqueData);
        } else {
            // Line Series
            const series = chart.addSeries(LineSeries, {
                color: '#22d3ee',
                lineWidth: 2,
            });
            // Map to LineData format { time, value }
            const lineData = uniqueData.map(d => ({ time: d.time, value: d.close }));
            series.setData(lineData);
        }

        chart.timeScale().fitContent();

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, chartType]);

    return (
        <div className="relative">
            {/* Toggle Controls */}
            <div className="absolute top-2 left-2 z-10 flex gap-1 bg-black/40 backdrop-blur-md rounded-lg p-1 border border-white/10">
                <button
                    onClick={() => setChartType('candle')}
                    className={`p-1.5 rounded-md transition-all ${chartType === 'candle' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                    title="Candlestick Chart"
                >
                    <BarChart2 size={16} />
                </button>
                <button
                    onClick={() => setChartType('line')}
                    className={`p-1.5 rounded-md transition-all ${chartType === 'line' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                    title="Line Chart"
                >
                    <Activity size={16} />
                </button>
            </div>

            <div ref={chartContainerRef} className="w-full h-[350px]" />
        </div>
    );
}
