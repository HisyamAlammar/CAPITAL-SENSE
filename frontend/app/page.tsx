import HeroSection from '@/components/HeroSection';
import StockDashboard from '@/components/StockDashboard';
import NewsFeed from '@/components/NewsFeed';
import { BookOpen, TrendingUp, AlertTriangle, PieChart } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen relative z-10">
      <HeroSection />

      {/* 4 Top Movers Only, No Search/Tabs */}
      <StockDashboard simpleView={true} />

      {/* 4 Hot News Only */}
      <NewsFeed limit={4} />

      {/* Educational Section */}
      <section className="w-full max-w-7xl mx-auto px-6 py-10 pb-20 border-t border-white/5">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="text-yellow-400" size={28} />
          <h2 className="text-2xl font-bold">Belajar Dasar Saham</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-yellow-500/30 transition-colors">
            <TrendingUp className="text-green-400 mb-4" size={32} />
            <h3 className="text-lg font-bold mb-2">Apa itu Saham?</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Saham adalah bukti kepemilikan nilai sebuah perusahaan. Dengan membeli saham, kamu menjadi salah satu pemilik perusahaan tersebut dan berhak atas keuntungan (dividen).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-yellow-500/30 transition-colors">
            <PieChart className="text-blue-400 mb-4" size={32} />
            <h3 className="text-lg font-bold mb-2">Analisis Fundamental</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Metode menilai kesehatan perusahaan dengan melihat laporan keuangan, model bisnis, dan manajemen. Tujuannya menemukan saham "Undervalued" (murah tapi bagus).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-yellow-500/30 transition-colors">
            <AlertTriangle className="text-red-400 mb-4" size={32} />
            <h3 className="text-lg font-bold mb-2">Manajemen Risiko</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Jangan taruh semua telur di satu keranjang. Diversifikasi portofolio dan gunakan "Uang Dingin" adalah kunci bertahan lama di pasar modal.
            </p>
          </div>
        </div>
      </section>

      <footer className="w-full text-center py-8 text-gray-500 text-sm border-t border-white/5">
        <p>© 2026 CAPITAL SENSE. All Rights Reserved.</p>
      </footer>
    </main>
  );
}
