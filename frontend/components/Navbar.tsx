'use client';

import { motion } from 'framer-motion';
import { LayoutDashboard, Newspaper, LineChart, LogOut, PieChart } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        // Clear cookie
        document.cookie = "auth_token=; path=/; max-age=0";
        router.push('/login');
    };

    // Hide Navbar on Login page
    if (pathname === '/login') return null;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-black/50 backdrop-blur-md border-b border-white/5">
            <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 tracking-wider">
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
                <Link
                    href="/portfolio"
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${pathname === '/portfolio' ? 'bg-white/10 text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <PieChart size={16} /> Portfolio
                </Link>
            </div>

            <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
                <LogOut size={18} />
                <span className="hidden md:inline">Logout</span>
            </button>
        </nav>
    );
}
