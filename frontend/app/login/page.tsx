'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [code, setCode] = useState('');
    const [error, setError] = useState(false);
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        // Simple "Hardcoded" check for MVP or Env Var check
        // Ideally, this calls an API route to verify and set a secure HttpOnly cookie.
        // For this "Personal Beta" use case, we'll store a simple cookie locally.

        const ACCESS_CODE = process.env.NEXT_PUBLIC_ACCESS_CODE || '220605'; // Default fallback

        if (code === 'ADMINCS') {
            // Admin Access
            router.push('/admin');
        } else if (code === ACCESS_CODE) {
            // Set simple cookie
            document.cookie = "auth_token=valid; path=/; max-age=86400"; // Expires in 1 day
            router.push('/');
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl relative z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="p-4 rounded-full bg-white/5 mb-4 border border-white/5">
                        <Lock size={32} className="text-cyan-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Restricted Access</h1>
                    <p className="text-gray-400 text-center text-sm">
                        Website ini dalam mode <span className="text-cyan-400 font-bold">Private Analysis Beta</span>.
                        Masukkan kode akses untuk melanjutkan.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <input
                            type="password"
                            placeholder="Masukkan Kode Akses..."
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className={`w-full bg-black/40 border rounded-xl px-4 py-3 text-center text-xl tracking-widest text-white placeholder-gray-600 focus:outline-none focus:ring-2 transition-all
                            ${error ? 'border-red-500/50 focus:ring-red-500/20 animate-shake' : 'border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20'}`}
                        />
                        {error && (
                            <p className="text-red-400 text-xs text-center mt-2">Kode akses salah. Silakan coba lagi.</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 group"
                    >
                        Masuk Dashboard <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-gray-500">
                    <ShieldCheck size={14} />
                    <span>Secure Environment v1.0</span>
                </div>
            </motion.div>
        </main>
    );
}
