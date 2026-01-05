"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Coins, 
  Key, 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  Settings, 
  Loader2,
  CheckCircle2,
  HelpCircle,
  X,
  User,
  ExternalLink,
  MessageCircle,
  Home as HomeIcon
} from "lucide-react";
import Link from "next/link";

export default function StorePage() {
  const router = useRouter();
  const [discordId, setDiscordId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

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
      const content = `GUMZ${discordId}`;
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
        const expiry = Math.floor(Date.now() / 1000) + 600;
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
    <div className="min-h-screen bg-[#FFF9F5]">

      {/* Guide Modal */}
      <AnimatePresence>
        {showGuide && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-6 z-50">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGuide(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl clay-card overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-cyan-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-cyan-500 border-[3px] border-slate-900 rounded-2xl flex items-center justify-center text-white shadow-[3px_3px_0px_0px_#1E293B]">
                    <HelpCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">Hướng dẫn lấy ID</h2>
                    <p className="text-cyan-600 text-sm font-bold uppercase tracking-wider">Discord Identity Guide</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowGuide(false)}
                  className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm group"
                >
                  <X className="w-6 h-6 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                {/* Method 1 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500 text-white font-black text-sm border-2 border-slate-900">1</span>
                    <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter">Cách 1: Sử dụng Lệnh Bot (Nhanh nhất)</h3>
                  </div>
                  <div className="clay-card p-6 space-y-4">
                    <p className="text-slate-600 leading-relaxed font-medium">
                      Truy cập vào bất kỳ kênh nào có <span className="text-cyan-600 font-bold">GumballZ Bot</span> và sử dụng lệnh:
                    </p>
                    <div className="bg-slate-900 p-4 rounded-xl font-mono text-cyan-400 flex items-center justify-between group">
                      <code className="text-lg font-bold">/id</code>
                      <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
                    </div>
                    <p className="text-xs text-slate-400 italic">Bot sẽ phản hồi lại ngay lập tức dãy số ID Discord của bạn (VD: 561443914062757908).</p>
                  </div>
                </div>

                {/* Method 2 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500 text-white font-black text-sm border-2 border-slate-900">2</span>
                    <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter">Cách 2: Cài đặt Thủ công (Không cần Bot)</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="clay-card p-6 space-y-3">
                      <div className="w-10 h-10 bg-cyan-100 border-2 border-slate-900 rounded-xl flex items-center justify-center text-slate-600 mb-2">
                        <Settings className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-900">Bật Chế độ CV</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">Vào <b>Cài đặt người dùng</b> &rarr; <b>Nâng cao</b> &rarr; Bật <b>Chế độ nhà phát triển</b>.</p>
                    </div>
                    <div className="clay-card p-6 space-y-3">
                      <div className="w-10 h-10 bg-cyan-100 border-2 border-slate-900 rounded-xl flex items-center justify-center text-slate-600 mb-2">
                        <User className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-900">Sao chép ID</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">Nhấn chuột phải (hoặc giữ) vào ảnh đại diện của bạn &rarr; Chọn <b>Sao chép ID người dùng</b>.</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-cyan-500 border-[3px] border-slate-900 rounded-3xl text-white flex items-center justify-between group cursor-pointer hover:bg-cyan-600 transition-all shadow-[4px_4px_0px_0px_#1E293B]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur border-2 border-white rounded-2xl flex items-center justify-center">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-black text-lg uppercase tracking-tight">Cần hỗ trợ thêm?</div>
                      <div className="text-cyan-100 text-sm">Liên hệ Admin qua Discord ngay</div>
                    </div>
                  </div>
                  <ExternalLink className="w-6 h-6 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-100 border-[3px] border-slate-900 rounded-full shadow-[3px_3px_0px_0px_#1E293B] font-bold text-sm"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
              <span className="text-slate-900">GumballZ System v3.1</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-4xl md:text-6xl font-black tracking-tight text-slate-900"
            >
              Nạp Coiz <span className="text-cyan-500">Tự Động</span>
            </motion.h1>
            
            <p className="text-slate-600 text-lg max-w-2xl mx-auto font-medium">
              Hệ thống nạp tiền uy tín, bảo mật và hoàn toàn tự động cho cộng đồng GumballZ.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8">
              <div className="clay-card p-8 md:p-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                  <Settings className="w-6 h-6 text-cyan-500" />
                  Thông tin nạp tiền
                </h2>

                <div className="grid md:grid-cols-2 gap-8 text-left">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-sm font-bold text-slate-700">ID Discord Của Bạn</label>
                      <button 
                        onClick={() => setShowGuide(true)}
                        className="text-[10px] font-black uppercase text-cyan-600 hover:text-cyan-700 transition-colors flex items-center gap-1 group"
                      >
                        <HelpCircle className="w-3 h-3 group-hover:rotate-12 transition-transform" /> Không biết lấy ID?
                      </button>
                    </div>
                    <input 
                      type="text" 
                      value={discordId}
                      onChange={(e) => setDiscordId(e.target.value)}
                      placeholder="VD: 561443914062757908" 
                      className="w-full bg-slate-50 border-[3px] border-slate-900 rounded-2xl px-6 py-4 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all text-slate-900 font-mono text-lg shadow-[3px_3px_0px_0px_#1E293B]"
                    />
                    <div className="p-4 bg-cyan-50 border-2 border-cyan-200 rounded-2xl text-xs text-cyan-600 leading-relaxed font-medium">
                      Hệ thống sẽ cộng Coiz trực tiếp vào tài khoản Discord gắn với ID này.
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-700 ml-1">Số Tiền Muốn Nạp</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Nhập số tiền..." 
                        className="w-full bg-slate-50 border-[3px] border-slate-900 rounded-2xl px-6 py-4 pr-16 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all text-slate-900 font-bold text-xl shadow-[3px_3px_0px_0px_#1E293B]"
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">VNĐ</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {predefinedAmounts.map((item) => (
                        <button 
                          key={item.value} 
                          onClick={() => setAmount(item.value)}
                          className={`py-2 rounded-xl border-[3px] text-xs font-bold transition-all ${
                            amount === item.value 
                            ? "bg-cyan-500 border-slate-900 text-white shadow-[3px_3px_0px_0px_#1E293B]" 
                            : "bg-white border-slate-900 text-slate-600 hover:bg-cyan-50 shadow-[2px_2px_0px_0px_#1E293B] hover:shadow-[1px_1px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px"
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
                  className="clay-button w-full mt-10 !py-5 !text-xl flex items-center justify-center gap-3 group disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "XÁC NHẬN NẠP TIỀN"}
                  {!loading && <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="clay-card p-8">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-500" />
                  Quy trình nạp
                </h3>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <span className="w-8 h-8 rounded-full bg-cyan-500 border-2 border-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">1</span>
                    <p className="text-slate-600 text-sm leading-relaxed">Nhập <b>ID Discord</b> để nhận Coiz.</p>
                  </li>
                  <li className="flex gap-4">
                    <span className="w-8 h-8 rounded-full bg-cyan-500 border-2 border-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">2</span>
                    <p className="text-slate-600 text-sm leading-relaxed">Chọn số tiền và nhấn <b>Xác nhận</b>.</p>
                  </li>
                  <li className="flex gap-4">
                    <span className="w-8 h-8 rounded-full bg-cyan-500 border-2 border-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">3</span>
                    <p className="text-slate-600 text-sm leading-relaxed">Quét mã QR và đợi <b>1-3 phút</b> để Coiz vào ví.</p>
                  </li>
                </ul>
              </div>

              <div className="clay-card p-8 bg-gradient-to-br from-cyan-100 to-cyan-200">
                <Zap className="w-10 h-10 mb-4 text-cyan-600" />
                <h3 className="text-xl font-bold mb-2 text-slate-900">Xử lý siêu tốc</h3>
                <p className="text-slate-700 text-sm leading-relaxed">Mọi giao dịch đều được xử lý tự động 24/7 bởi hệ thống ngân hàng.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
