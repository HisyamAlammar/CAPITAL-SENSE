'use client';

import { motion } from 'framer-motion';
import { LayoutDashboard, Newspaper, LineChart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-black/50 backdrop-blur-md border-b border-white/5">
            <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                    CAPITAL SENSE
                </span>
            </Link>

            <div className="hidden md:flex gap-1 p-1 rounded-full bg-white/5 border border-white/5">
                <Link
                    href="/market"
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${pathname === '/market' ? 'bg-white/10 text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <LineChart size={16} /> Saham
                </Link>
                <Link
                    href="/news"
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${pathname === '/news' ? 'bg-white/10 text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Newspaper size={16} /> Berita
                </Link>
            </div>

            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600" />
        </nav>
    );
}
