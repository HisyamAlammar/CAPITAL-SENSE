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
        <>
            {/* Top Navbar (Desktop) */}
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

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/5"
                    >
                        <LogOut size={18} />
                        <span className="hidden md:inline">Logout</span>
                    </button>
                </div>
            </nav>

            {/* Bottom Navigation (Mobile Only) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/10 pb-safe">
                <div className="grid grid-cols-5 items-center p-2">
                    <Link
                        href="/market"
                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${pathname === '/market' ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <LineChart size={20} strokeWidth={pathname === '/market' ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">Saham</span>
                    </Link>

                    <Link
                        href="/news"
                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${pathname === '/news' ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Newspaper size={20} strokeWidth={pathname === '/news' ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">Berita</span>
                    </Link>

                    {/* Center Action Button (Home/Dashboard) */}
                    <div className="relative -mt-8 flex justify-center">
                        <Link
                            href="/"
                            className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 shadow-lg shadow-purple-500/30 border-4 border-[#0A0A0A]"
                        >
                            <LayoutDashboard size={24} className="text-white" />
                        </Link>
                    </div>

                    <Link
                        href="/portfolio"
                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${pathname === '/portfolio' ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <PieChart size={20} strokeWidth={pathname === '/portfolio' ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">Portfolio</span>
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all text-gray-500 hover:text-red-400"
                    >
                        <LogOut size={20} />
                        <span className="text-[10px] font-medium">Keluar</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
