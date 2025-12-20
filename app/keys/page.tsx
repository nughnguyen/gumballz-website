"use client";
// v2
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gift, 
  Crown, 
  ShieldCheck, 
  Clock, 
  Zap, 
  ChevronRight, 
  ExternalLink, 
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Coins,
  Key
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function KeysPage() {
  const router = useRouter();
  const [loadingFree, setLoadingFree] = useState(false);
  const [freeKeyLink, setFreeKeyLink] = useState("");
  const [freeKeyExpiry, setFreeKeyExpiry] = useState("");
  const [copied, setCopied] = useState(false);
  const [loadingVIP, setLoadingVIP] = useState(false);

  const fetchFreeKey = async () => {
    setLoadingFree(true);
    try {
      const res = await fetch("/api/keys/generate-free", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setFreeKeyLink(data.shortLink);
        setFreeKeyExpiry(data.expiresAt);
      } else {
        alert(data.error || "Không thể lấy key");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Lỗi kết nối server");
    } finally {
      setLoadingFree(false);
    }
  };

  const buyVipKey = async () => {
    setLoadingVIP(true);
    try {
      const content = `VIP${Math.floor(Math.random() * 900000 + 100000)}`;
      const amount = 50000;
      
      const res = await fetch("/api/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          userId: "GUEST",
          content: content,
          method: "Banking",
          metadata: { 
            type: "key", 
            duration_days: 30 
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        const expiry = Math.floor(Date.now() / 1000) + 600;
        const url = `/payment?amount=${amount}&content=${content}&method=Banking&expiry=${expiry}&txId=${data.id}`;
        router.push(url);
      } else {
        alert("Lỗi tạo giao dịch: " + data.error);
      }
    } catch (error) {
      console.error("Buy VIP Error:", error);
      alert("Lỗi kết nối server");
    } finally {
      setLoadingVIP(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(freeKeyLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white selection:bg-blue-500/30 pb-20 font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 container mx-auto px-6 pt-12 max-w-6xl">
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-16">
          <div className="bg-slate-800/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 flex gap-2">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
            >
              <Coins className="w-5 h-5" /> Nạp Coiz
            </button>
            <button
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-all"
            >
              <Key className="w-5 h-5" /> Hệ thống Key
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 uppercase italic">
            Hệ thống <span className="text-blue-500">Key Mod</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Nhận key miễn phí hoặc mua key VIP để mở khóa toàn bộ tính năng.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* FREE KEY */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="group relative"
          >
            <div className="relative bg-[#111827]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="p-4 rounded-2xl bg-emerald-500/10">
                  <Gift className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  Trải nghiệm
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-4 italic">KEY MIỄN PHÍ</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">Key hết hạn lúc 00:00 VN hằng ngày. Vượt link quảng cáo để nhận.</p>

              <div className="space-y-4 mb-10 grow">
                <div className="flex items-center gap-3 text-slate-300">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <span>Reset lúc 00:00 VN hằng ngày</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <span>Cần vượt 1 link Yeulink</span>
                </div>
              </div>

              <div className="mt-auto">
                <AnimatePresence mode="wait">
                  {!freeKeyLink ? (
                    <motion.button
                      key="fetch-btn"
                      onClick={fetchFreeKey}
                      disabled={loadingFree}
                      className="w-full py-5 rounded-2xl bg-emerald-500 text-slate-900 font-black text-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                    >
                      {loadingFree ? <Loader2 className="animate-spin" /> : "LẤY KEY MIỄN PHÍ"}
                    </motion.button>
                  ) : (
                    <motion.div key="link-ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                        <div className="grow bg-black/40 px-3 py-2 rounded-lg font-mono text-xs overflow-hidden text-ellipsis text-slate-300 border border-white/5">{freeKeyLink}</div>
                        <button onClick={copyToClipboard} className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                        </button>
                      </div>
                      <a href={freeKeyLink} target="_blank" rel="noopener noreferrer" className="w-full py-5 rounded-2xl bg-white text-black font-black text-xl flex items-center justify-center gap-3 transition-all uppercase">
                        Vượt Link & Nhận Key <ExternalLink className="w-6 h-6" />
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* PREMIUM KEY */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="group relative"
          >
            <div className="relative bg-[#111827]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="p-4 rounded-2xl bg-purple-500/10">
                  <Crown className="w-8 h-8 text-purple-400" />
                </div>
                <div className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
                  VIP PREMIUM
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-4 italic text-purple-100">KEY VIP 30 NGÀY</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">Không quảng cáo. Kích hoạt nhận key ngay lập tức. Tính 30 ngày từ lúc mua.</p>

              <div className="space-y-4 mb-10 grow">
                <div className="flex items-center gap-3 text-slate-300">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  <span>Full tính năng VIP - Không quảng cáo</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Zap className="w-5 h-5 text-purple-400" />
                  <span>Tự động kích hoạt & nhận key ngay</span>
                </div>
              </div>

              <div className="mt-auto space-y-4">
                <button
                  onClick={buyVipKey}
                  disabled={loadingVIP}
                  className="w-full py-5 rounded-2xl bg-purple-600 text-white font-black text-xl flex items-center justify-center gap-3 hover:bg-purple-500 hover:shadow-[0_0_30px_rgba(147,51,234,0.3)] transition-all uppercase disabled:opacity-50"
                >
                  {loadingVIP ? <Loader2 className="animate-spin" /> : "Mua Key VIP"} 
                  <Crown className="w-6 h-6" />
                </button>
                <div className="text-center text-slate-500 text-sm">
                  Chỉ <span className="text-purple-400 font-bold">50.000đ</span> / 30 ngày
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
