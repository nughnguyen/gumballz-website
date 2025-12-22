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
          userId: "123456789", // Anonymous order
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
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Nav Tabs */}
        <div className="flex justify-center mb-16">
          <div className="bg-slate-200/50 p-1.5 rounded-2xl flex gap-2">
            <button
              onClick={() => router.push('/store')}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-slate-500 hover:text-slate-700 transition-all"
            >
              <Coins className="w-5 h-5" /> Nạp Coiz
            </button>
            <button className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-white text-blue-600 shadow-sm transition-all border border-blue-100">
              <Key className="w-5 h-5" /> Hệ thống Key
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4 uppercase">
            Hệ thống <span className="text-blue-600">Key Mod</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
            Lấy key miễn phí hoặc mua key VIP để mở khóa toàn bộ tính năng mod menu.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* FREE KEY CARD */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-xl shadow-blue-900/5 flex flex-col relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Gift className="w-40 h-40 text-blue-600" />
            </div>

            <div className="flex items-center justify-between mb-10">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <Gift className="w-8 h-8 text-emerald-500" />
              </div>
              <span className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-widest">Dùng Thử</span>
            </div>

            <h2 className="text-3xl font-black text-slate-900 mb-4">KEY MIỄN PHÍ</h2>
            <p className="text-slate-500 mb-8 font-medium">Key hết hạn lúc 00:00 VN hằng ngày. Vượt link để nhận key hôm nay.</p>

            <div className="space-y-4 mb-10 grow">
              <div className="flex items-center gap-3 text-slate-600 font-medium">
                <Clock className="w-5 h-5 text-emerald-500" />
                <span>Reset lúc 00:00 mỗi ngày</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 font-medium">
                <Zap className="w-5 h-5 text-emerald-500" />
                <span>Cần vượt 1 link quảng cáo</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!freeKeyLink ? (
                <button
                  onClick={fetchFreeKey}
                  disabled={loadingFree}
                  className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {loadingFree ? <Loader2 className="animate-spin" /> : "BẮT ĐẦU LẤY KEY"}
                </button>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                    <div className="grow font-mono text-sm text-slate-500 truncate">{freeKeyLink}</div>
                    <button onClick={copyToClipboard} className="p-2 rounded-xl hover:bg-white transition-colors">
                      {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-slate-400" />}
                    </button>
                  </div>
                  <a href={freeKeyLink} target="_blank" rel="noopener noreferrer" className="w-full py-5 rounded-2xl bg-emerald-500 text-white font-black text-lg flex items-center justify-center gap-3 hover:bg-emerald-600 shadow-lg shadow-emerald-600/20 transition-all uppercase">
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
            className="bg-white rounded-[2.5rem] p-10 border-4 border-blue-500/20 shadow-2xl shadow-blue-600/10 flex flex-col relative"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <Crown className="w-8 h-8 text-blue-600" />
              </div>
              <span className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-widest">Premium VIP</span>
            </div>

            <h2 className="text-3xl font-black text-slate-900 mb-4">KEY VIP MOD</h2>
            <p className="text-slate-500 mb-8 font-medium">Không quảng cáo. Kích hoạt và nhận key ngay lập tức qua hệ thống.</p>

            <div className="space-y-6 mb-10 grow">
              {/* Duration Select */}
              <div className="relative">
                <label className="text-xs font-black text-slate-400 uppercase mb-2 block ml-1">Chọn thời hạn sử dụng</label>
                <button 
                  onClick={() => setShowDuration(!showDuration)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-6 py-4 flex items-center justify-between hover:border-blue-500 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
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
                      className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-2xl overflow-hidden z-50 shadow-2xl"
                    >
                      {durations.map((d) => (
                        <button
                          key={d.value}
                          onClick={() => {
                            setDuration(d.value);
                            setShowDuration(false);
                          }}
                          className={`w-full px-6 py-4 text-left flex items-center justify-between hover:bg-blue-50 transition-colors ${duration === d.value ? "bg-blue-50" : ""}`}
                        >
                          <span className={`font-bold ${duration === d.value ? "text-blue-600" : "text-slate-700"}`}>{d.label}</span>
                          <span className="text-sm font-bold text-slate-400">{d.price.toLocaleString()}đ</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-600 font-medium">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>Full tính năng VIP - Không quảng cáo</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 font-medium">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span>Tự động kích hoạt ngay sau khi nạp</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={buyVipKey}
                disabled={loadingVIP}
                className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center gap-3 hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all uppercase disabled:opacity-50"
              >
                {loadingVIP ? <Loader2 className="animate-spin" /> : "MUA KEY VIP NGAY"}
              </button>
              <div className="text-center">
                <span className="text-slate-400 text-sm font-bold">Thanh toán:</span>
                <span className="text-blue-600 text-xl font-black ml-2">{selectedDuration.price.toLocaleString()}đ</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
