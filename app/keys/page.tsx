"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gift, 
  Crown, 
  ShieldCheck, 
  Clock, 
  Zap, 
  ExternalLink, 
  Loader2,
  Copy,
  Check,
  Coins,
  Key,
  ChevronDown
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function KeysPage() {
  const router = useRouter();
  const [loadingFree, setLoadingFree] = useState(false);
  const [freeKeyLink, setFreeKeyLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loadingVIP, setLoadingVIP] = useState(false);
  
  const [duration, setDuration] = useState("30");
  const [showDuration, setShowDuration] = useState(false);

  const durations = [
    { label: "1 Ngày", value: "1", price: 2000 },
    { label: "7 Ngày", value: "7", price: 12000 },
    { label: "30 Ngày", value: "30", price: 50000 },
    { label: "365 Ngày", value: "365", price: 500000 },
  ];

  const selectedDuration = durations.find(d => d.value === duration) || durations[2];

  const fetchFreeKey = async () => {
    setLoadingFree(true);
    try {
      const res = await fetch("/api/keys/generate-free", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setFreeKeyLink(data.shortLink);
      } else {
        alert(data.error || "Không thể lấy key");
      }
    } catch (error) {
      alert("Lỗi kết nối server");
    } finally {
      setLoadingFree(false);
    }
  };

  const buyVipKey = async () => {
    setLoadingVIP(true);
    try {
      const content = `KEY${Math.floor(Math.random() * 900000 + 100000)}`;
      const amount = selectedDuration.price;
      
      const res = await fetch("/api/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          userId: "123456789",
          content: content,
          method: "Banking",
          metadata: { 
            type: "key", 
            duration_days: parseInt(duration) 
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        const expiry = Math.floor(Date.now() / 1000) + 600;
        router.push(`/payment?amount=${amount}&content=${content}&method=Banking&expiry=${expiry}&txId=${data.id}`);
      } else {
        alert("Lỗi: " + data.error);
      }
    } catch (error) {
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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 pt-28 pb-20 max-w-6xl">

        {/* Key Grid */}
        <div className="grid lg:grid-cols-2 gap-10">
          {/* FREE KEY CARD */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="clay-card p-10 flex flex-col relative overflow-hidden bg-gradient-to-br from-green-50 to-white"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Gift className="w-40 h-40 text-green-600" />
            </div>

            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="p-4 rounded-2xl bg-green-100 border-[3px] border-slate-900 shadow-[3px_3px_0px_0px_#1E293B]">
                <Gift className="w-8 h-8 text-green-600" />
              </div>
              <span className="px-4 py-1.5 rounded-full bg-green-500 border-2 border-slate-900 text-white text-xs font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_#1E293B]">Dùng Thử</span>
            </div>

            <h2 className="text-3xl font-black text-slate-900 mb-4">KEY MIỄN PHÍ</h2>
            <p className="text-slate-600 mb-8 font-medium">Key hết hạn lúc 00:00 VN hằng ngày. Vượt link để nhận key hôm nay.</p>

            <div className="space-y-4 mb-10 grow">
              <div className="flex items-center gap-3 text-slate-700 font-medium">
                <Clock className="w-5 h-5 text-green-600" />
                <span>Reset lúc 00:00 mỗi ngày</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 font-medium">
                <Zap className="w-5 h-5 text-green-600" />
                <span>Cần vượt 1 link quảng cáo</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!freeKeyLink ? (
                <button
                  onClick={fetchFreeKey}
                  disabled={loadingFree}
                  className="w-full py-5 rounded-2xl bg-slate-900 border-[3px] border-slate-900 text-white font-black text-lg flex items-center justify-center gap-3 hover:bg-slate-800 shadow-[4px_4px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                >
                  {loadingFree ? <Loader2 className="animate-spin" /> : "BẮT ĐẦU LẤY KEY"}
                </button>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white border-[3px] border-slate-900 shadow-[3px_3px_0px_0px_#1E293B] flex items-center gap-3">
                    <div className="grow font-mono text-sm text-slate-500 truncate">{freeKeyLink}</div>
                    <button onClick={copyToClipboard} className="p-2 rounded-xl hover:bg-slate-50 transition-colors">
                      {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-slate-400" />}
                    </button>
                  </div>
                  <a href={freeKeyLink} target="_blank" rel="noopener noreferrer" className="w-full py-5 rounded-2xl bg-green-500 border-[3px] border-slate-900 text-white font-black text-lg flex items-center justify-center gap-3 hover:bg-green-600 shadow-[4px_4px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase">
                    Mở Link Nhận Key <ExternalLink className="w-5 h-5" />
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* PREMIUM KEY CARD */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="clay-card p-10 flex flex-col relative bg-gradient-to-br from-cyan-50 to-white border-[4px] !border-cyan-500"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="p-4 rounded-2xl bg-cyan-100 border-[3px] border-slate-900 shadow-[3px_3px_0px_0px_#1E293B]">
                <Crown className="w-8 h-8 text-cyan-600" />
              </div>
              <span className="px-4 py-1.5 rounded-full bg-cyan-500 border-2 border-slate-900 text-white text-xs font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_#1E293B]">Premium VIP</span>
            </div>

            <h2 className="text-3xl font-black text-slate-900 mb-4">KEY VIP MOD</h2>
            <p className="text-slate-600 mb-8 font-medium">Không quảng cáo. Kích hoạt và nhận key ngay lập tức qua hệ thống.</p>

            <div className="space-y-6 mb-10 grow">
              {/* Duration Select */}
              <div className="relative">
                <label className="text-xs font-black text-slate-500 uppercase mb-2 block ml-1">Chọn thời hạn sử dụng</label>
                <button 
                  onClick={() => setShowDuration(!showDuration)}
                  className="w-full bg-white border-[3px] border-slate-900 rounded-2xl px-6 py-4 flex items-center justify-between hover:border-cyan-500 shadow-[3px_3px_0px_0px_#1E293B] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-cyan-600" />
                    <span className="font-bold text-slate-800 text-lg">{selectedDuration.label}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showDuration ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {showDuration && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-3 bg-white border-[3px] border-slate-900 rounded-2xl overflow-hidden z-50 shadow-[5px_5px_0px_0px_#1E293B]"
                    >
                      {durations.map((d) => (
                        <button
                          key={d.value}
                          onClick={() => {
                            setDuration(d.value);
                            setShowDuration(false);
                          }}
                          className={`w-full px-6 py-4 text-left flex items-center justify-between hover:bg-cyan-50 transition-colors ${duration === d.value ? "bg-cyan-50" : ""}`}
                        >
                          <span className={`font-bold ${duration === d.value ? "text-cyan-600" : "text-slate-700"}`}>{d.label}</span>
                          <span className="text-sm font-bold text-slate-400">{d.price.toLocaleString()}đ</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-700 font-medium">
                  <ShieldCheck className="w-5 h-5 text-cyan-600" />
                  <span>Full tính năng VIP - Không quảng cáo</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700 font-medium">
                  <Zap className="w-5 h-5 text-cyan-600" />
                  <span>Tự động kích hoạt ngay sau khi nạp</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={buyVipKey}
                disabled={loadingVIP}
                className="clay-button w-full !py-5 !text-xl flex items-center justify-center gap-3 uppercase disabled:opacity-50"
              >
                {loadingVIP ? <Loader2 className="animate-spin" /> : "MUA KEY VIP NGAY"}
              </button>
              <div className="text-center">
                <span className="text-slate-500 text-sm font-bold">Thanh toán:</span>
                <span className="text-cyan-600 text-xl font-black ml-2">{selectedDuration.price.toLocaleString()}đ</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
