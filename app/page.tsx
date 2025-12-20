"use client";

import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Zap, 
  Coins, 
  Key, 
  ChevronRight, 
  Shield, 
  Settings,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [discordId, setDiscordId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const predefinedAmounts = [
    { label: "10k", value: "10000" },
    { label: "20k", value: "20000" },
    { label: "50k", value: "50000" },
    { label: "100k", value: "100000" },
  ];

  const handleDeposit = async () => {
    if (!discordId.trim()) {
      alert("Vui lòng nhập ID Discord");
      return;
    }
    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum < 1000) {
      alert("Số tiền nạp tối thiểu là 1.000đ");
      return;
    }

    setLoading(true);
    try {
      const content = `NAP${Math.floor(Math.random() * 900000 + 100000)}`;
      const res = await fetch("/api/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          userId: discordId,
          content: content,
          method: "Banking",
          metadata: { type: "deposit" }
        })
      });

      const data = await res.json();
      if (data.success) {
        const expiry = Math.floor(Date.now() / 1000) + 600; // 10 mins
        router.push(`/payment?amount=${amountNum}&content=${content}&method=Banking&expiry=${expiry}&txId=${data.id}`);
      } else {
        alert("Lỗi: " + data.error);
      }
    } catch (error) {
      console.error("Deposit Error:", error);
      alert("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 selection:bg-blue-500/30 font-sans">
      {/* Soft Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-[30%] h-[30%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[15%] w-[30%] h-[30%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 container mx-auto px-6 py-12 lg:py-20 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-widest"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> GumballZ System v3.0
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4"
          >
            Nạp Coiz <span className="text-blue-500">Tự Động</span>
          </motion.h1>
          
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Hệ thống nạp tiền nhanh chóng, bảo mật và hoàn toàn tự động cho cộng đồng GumballZ.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-slate-800/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 flex gap-2">
            <button
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-all"
            >
              <Coins className="w-5 h-5" /> Nạp Coiz
            </button>
            <button
              onClick={() => router.push('/keys')}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
            >
              <Key className="w-5 h-5" /> Hệ thống Key
            </button>
          </div>
        </div>

        {/* Deposit Layout */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left: Form & Info */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-800/40 rounded-[2rem] border border-white/5 p-8 md:p-10 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Settings className="w-6 h-6 text-blue-500" />
                Thông tin nạp tiền
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-slate-400 ml-1">Nhập ID Discord</label>
                  <input 
                    type="text" 
                    value={discordId}
                    onChange={(e) => setDiscordId(e.target.value)}
                    placeholder="VD: 561443914062757908" 
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-5 py-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-white font-mono"
                  />
                  <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl text-xs text-blue-400 leading-relaxed">
                    ID Discord là dãy số định danh của bạn. Bạn có thể lấy bằng lệnh /id trong Bot.
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold text-slate-400 ml-1">Mệnh giá nạp (VNĐ)</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Nhập số tiền..." 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-5 py-4 pr-16 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-white font-bold text-lg"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">VNĐ</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {predefinedAmounts.map((item) => (
                      <button 
                        key={item.value} 
                        onClick={() => setAmount(item.value)}
                        className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all active:scale-95 ${
                          amount === item.value 
                          ? "bg-blue-600 border-blue-600 text-white" 
                          : "bg-white/5 border-white/5 text-slate-400 hover:border-white/10"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleDeposit}
                disabled={loading}
                className="w-full mt-8 py-5 bg-blue-600 text-white font-black text-xl rounded-2xl hover:bg-blue-500 hover:shadow-2xl hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "TIẾP TỤC NẠP TIỀN"} 
                {!loading && <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-800/30 border border-white/5 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">+20% Ưu đãi</div>
                  <div className="text-xs text-slate-500">Cho giao dịch trên 100k</div>
                </div>
              </div>
              <div className="p-6 bg-slate-800/30 border border-white/5 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <Key className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Xử lý tự động</div>
                  <div className="text-xs text-slate-500">Hoàn tất trong 1-3 phút</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: History/Instructions */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-800/40 rounded-[2rem] border border-white/5 p-8 backdrop-blur-sm">
                <h3 className="font-bold text-white mb-6">Hướng dẫn</h3>
                <ul className="space-y-4 text-sm">
                    <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold text-xs shrink-0">1</span>
                        <span className="text-slate-400 leading-relaxed">Nhập chính xác <b>ID Discord</b> của bạn.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold text-xs shrink-0">2</span>
                        <span className="text-slate-400 leading-relaxed">Chọn số tiền muốn nạp và nhấn <b>Tiếp tục</b>.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold text-xs shrink-0">3</span>
                        <span className="text-slate-400 leading-relaxed">Chuyển khoản theo nội dung hiển thị ở bước tiếp theo.</span>
                    </li>
                </ul>
            </div>
            
            <Link href="/history" className="block p-8 bg-blue-600/10 border border-blue-600/20 rounded-[2rem] group hover:bg-blue-600/20 transition-all">
                <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-400">Xem lịch sử nạp</span>
                    <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                </div>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-10 mt-20 opacity-40">
        <div className="container mx-auto px-6 text-center text-sm text-slate-500">
            © 2024 GumballZ Project. Phát triển bởi VN Modder.
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
