"use client";

import { useState, useEffect, Suspense } from "react";
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
  Home as HomeIcon,
  Copy,
  Check,
  Clock,
  AlertCircle,
  Download,
  Star,
  Gamepad2,
  MessageSquare
} from "lucide-react";
import Link from "next/link";

// ── Minecraft Constants ───────────────────────────────────────
const MC_PACKAGES = [
  { id: "20k", label: "20.000đ", vnd: 20000, xu: 20000, bonus: 0 },
  { id: "50k", label: "50.000đ", vnd: 50000, xu: 50000, bonus: 0 },
  { id: "100k", label: "100.000đ", vnd: 100000, xu: 110000, bonus: 10 },
  { id: "200k", label: "200.000đ", vnd: 200000, xu: 240000, bonus: 20 },
  { id: "500k", label: "500.000đ", vnd: 500000, xu: 650000, bonus: 30 },
];

const MC_AUTO_RANKS = [
  { vnd: 50000, rank: "VIP", color: "#f59e0b" },
  { vnd: 150000, rank: "VIP+", color: "#f97316" },
  { vnd: 350000, rank: "LEGEND", color: "#ef4444" },
  { vnd: 700000, rank: "GOD", color: "#a855f7" },
];

type McStep = "form" | "qr" | "done";

interface McOrderInfo {
  orderId: string;
  orderCode: string;
  amount: number;
  rewardXu: number;
  playerName: string;
  qrUrl: string;
  expiry: number;
  bankId: string;
  accountNo: string;
  accountName: string;
}

// ── Shared Components ─────────────────────────────────────────
function Row({ label, value, mono = false, highlight = false, onCopy, copied }: {
  label: string; value: string; mono?: boolean; highlight?: boolean;
  onCopy?: () => void; copied?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-400 font-bold text-xs uppercase">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-bold ${mono ? "font-mono" : ""} ${highlight ? "text-cyan-600" : "text-slate-800"}`}>{value}</span>
        {onCopy && (
          <button onClick={onCopy} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function StorePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"discord" | "minecraft">("discord");
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState("");

  // Discord State
  const [discordId, setDiscordId] = useState("");
  const [discordAmount, setDiscordAmount] = useState("");

  // Minecraft State
  const [mcPlayerName, setMcPlayerName] = useState("");
  const [mcSelectedPkg, setMcSelectedPkg] = useState<typeof MC_PACKAGES[0] | null>(null);
  const [mcCustomAmount, setMcCustomAmount] = useState("");
  const [mcUseCustom, setMcUseCustom] = useState(false);
  const [mcStep, setMcStep] = useState<McStep>("form");
  const [mcOrder, setMcOrder] = useState<McOrderInfo | null>(null);
  const [mcClaimCode, setMcClaimCode] = useState<string | null>(null);
  const [mcTimeLeft, setMcTimeLeft] = useState<number | null>(null);
  const [mcPollStatus, setMcPollStatus] = useState<"waiting" | "success" | "expired">("waiting");

  const predefinedAmounts = [
    { label: "10k", value: "10000" },
    { label: "20k", value: "20000" },
    { label: "50k", value: "50000" },
    { label: "100k", value: "100000" },
  ];

  // ── Discord Logic ───────────────────────────────────────────
  const handleDiscordDeposit = async () => {
    if (!discordId.trim()) {
      alert("Vui lòng nhập ID Discord");
      return;
    }
    const amountNum = parseInt(discordAmount);
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

  // ── Minecraft Logic ─────────────────────────────────────────
  useEffect(() => {
    if (!mcOrder || mcStep !== "qr") return;
    const expiryMs = mcOrder.expiry * 1000;
    const tick = setInterval(() => {
      const diff = expiryMs - Date.now();
      if (diff <= 0) {
        setMcTimeLeft(0);
        setMcPollStatus("expired");
        clearInterval(tick);
      } else {
        setMcTimeLeft(Math.floor(diff / 1000));
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [mcOrder, mcStep]);

  useEffect(() => {
    if (!mcOrder || mcStep !== "qr" || mcPollStatus !== "waiting") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/minecraft/claim-status?orderId=${mcOrder.orderId}`);
        const data = await res.json();
        if (data.success && data.status === "paid") {
          setMcClaimCode(data.claimCode);
          setMcPollStatus("success");
          setMcStep("done");
          clearInterval(interval);
        }
      } catch { /* ignore */ }
    }, 4000);
    return () => clearInterval(interval);
  }, [mcOrder, mcStep, mcPollStatus]);

  const getMcAmount = () => {
    if (mcUseCustom) return parseInt(mcCustomAmount) || 0;
    return mcSelectedPkg?.vnd || 0;
  };

  const getMcRewardXu = () => {
    if (mcUseCustom) return parseInt(mcCustomAmount) || 0;
    return mcSelectedPkg?.xu || 0;
  };

  const handleMcSubmit = async () => {
    if (!mcPlayerName.trim() || mcPlayerName.trim().length < 3) {
      alert("Nhập tên Minecraft (tối thiểu 3 ký tự)");
      return;
    }
    const amt = getMcAmount();
    if (amt < 10000) {
      alert("Số tiền tối thiểu 10.000đ");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/minecraft/web-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: mcPlayerName.trim(), amountVnd: amt, rewardXu: getMcRewardXu() })
      });
      const data = await res.json();
      if (data.success) {
        setMcOrder(data);
        setMcStep("qr");
        setMcPollStatus("waiting");
      } else {
        alert("Lỗi: " + data.error);
      }
    } catch {
      alert("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleDownloadQR = async () => {
    if (!mcOrder) return;
    try {
      const res = await fetch(mcOrder.qrUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `QR-${mcOrder.orderCode}.png`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { alert("Không tải được QR"); }
  };

  const fmtVnd = (n: number) => n.toLocaleString("vi-VN") + "đ";
  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

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
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500 text-white font-black text-sm border-2 border-slate-900">1</span>
                    <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter">Cách 1: Sử dụng Lệnh Bot</h3>
                  </div>
                  <div className="clay-card p-6 space-y-4">
                    <p className="text-slate-600 leading-relaxed font-medium">Dùng lệnh <code className="text-lg font-black text-cyan-600">/id</code> tại GumballZ Bot.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500 text-white font-black text-sm border-2 border-slate-900">2</span>
                    <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter">Cách 2: Cài đặt Thủ công</h3>
                  </div>
                  <p className="text-slate-600 text-sm">Bật <b>Developer Mode</b> trong Discord &rarr; Phải chuột vào tên bạn &rarr; <b>Sao chép ID</b>.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          
          {/* Header & Tabs */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6">
              Cửa Hàng <span className="text-cyan-500">GumballZ</span>
            </h1>
            
            <div className="flex justify-center gap-4 p-2 bg-slate-200/50 rounded-3xl w-fit mx-auto border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_#1E293B]">
              <button 
                onClick={() => { setActiveTab("discord"); setMcStep("form"); }}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all ${
                  activeTab === "discord" 
                  ? "bg-cyan-500 text-white shadow-[2px_2px_0px_0px_#1E293B]" 
                  : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <MessageSquare className="w-4 h-4" /> Discord Nạp Coiz
              </button>
              <button 
                onClick={() => setActiveTab("minecraft")}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all ${
                  activeTab === "minecraft" 
                  ? "bg-cyan-500 text-white shadow-[2px_2px_0px_0px_#1E293B]" 
                  : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Gamepad2 className="w-4 h-4" /> Minecraft Nạp Xu
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "discord" ? (
              <motion.div 
                key="discord"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid lg:grid-cols-12 gap-10"
              >
                {/* Existing Discord Content */}
                <div className="lg:col-span-8">
                  <div className="clay-card p-8 md:p-10">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                      <Settings className="w-6 h-6 text-cyan-500" /> Discord Payment
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-sm font-bold text-slate-700">ID Discord</label>
                          <button onClick={() => setShowGuide(true)} className="text-[10px] font-black uppercase text-cyan-600 flex items-center gap-1"><HelpCircle className="w-3 h-3" /> Hướng dẫn</button>
                        </div>
                        <input type="text" value={discordId} onChange={(e) => setDiscordId(e.target.value)} placeholder="561443..." className="w-full bg-slate-50 border-[3px] border-slate-900 rounded-2xl px-6 py-4 focus:border-cyan-500 outline-none text-slate-900 font-mono shadow-[3px_3px_0px_0px_#1E293B]" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-700 ml-1">Số Tiền (VND)</label>
                        <input type="number" value={discordAmount} onChange={(e) => setDiscordAmount(e.target.value)} placeholder="Nhập số tiền..." className="w-full bg-slate-50 border-[3px] border-slate-900 rounded-2xl px-6 py-4 focus:border-cyan-500 outline-none text-slate-900 font-bold shadow-[3px_3px_0px_0px_#1E293B]" />
                        <div className="grid grid-cols-4 gap-2">
                          {predefinedAmounts.map(item => (
                            <button key={item.value} onClick={() => setDiscordAmount(item.value)} className="py-2 rounded-xl border-2 border-slate-900 text-xs font-bold hover:bg-cyan-50 transition-all">{item.label}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button onClick={handleDiscordDeposit} disabled={loading} className="clay-button w-full mt-10 !py-5 !text-xl flex items-center justify-center gap-3 disabled:opacity-50">
                      {loading ? <Loader2 className="animate-spin" /> : "XÁC NHẬN NẠP COIZ"} <ArrowRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <div className="lg:col-span-4 space-y-6">
                  <div className="clay-card p-8">
                    <h3 className="font-bold mb-6 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-cyan-500" /> Discord Box</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">Nạp Coiz để mua các gói script VIP, hỗ trợ server và nhận các đặc quyền riêng trên Discord GumballZ.</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="minecraft"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                {/* Minecraft Step Controller */}
                {mcStep === "form" && (
                  <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-6">
                      <div className="clay-card p-8">
                        <h2 className="text-xl font-black flex items-center gap-2 mb-6"><User className="w-5 h-5 text-cyan-500" /> Tên Minecraft</h2>
                        <input type="text" value={mcPlayerName} onChange={(e) => setMcPlayerName(e.target.value)} placeholder="Steve..." className="w-full bg-slate-50 border-[3px] border-slate-900 rounded-2xl px-6 py-4 focus:border-cyan-500 outline-none font-mono font-bold text-lg shadow-[3px_3px_0px_0px_#1E293B]" />
                      </div>
                      <div className="clay-card p-8">
                        <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Coins className="w-5 h-5 text-cyan-500" /> Gói Nạp Minecraft</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                          {MC_PACKAGES.map(pkg => (
                            <button key={pkg.id} onClick={() => { setMcSelectedPkg(pkg); setMcUseCustom(false); }} className={`p-4 rounded-2xl border-[3px] border-slate-900 text-left transition-all ${!mcUseCustom && mcSelectedPkg?.id === pkg.id ? "bg-cyan-500 text-white shadow-[4px_4px_0px_0px_#1E293B]" : "bg-white text-slate-700 shadow-[2px_2px_0px_0px_#1E293B]"}`}>
                              <div className="font-black">{pkg.label}</div>
                              <div className="text-xs font-bold opacity-80">{pkg.xu.toLocaleString()} xu</div>
                            </button>
                          ))}
                          <button onClick={() => { setMcUseCustom(true); setMcSelectedPkg(null); }} className={`p-4 rounded-2xl border-[3px] border-slate-900 text-left transition-all ${mcUseCustom ? "bg-cyan-500 text-white shadow-[4px_4px_0px_0px_#1E293B]" : "bg-white text-slate-700 shadow-[2px_2px_0px_0px_#1E293B]"}`}>
                            <div className="font-black">Tùy chỉnh</div>
                          </button>
                        </div>
                        {mcUseCustom && <input type="number" value={mcCustomAmount} onChange={(e) => setMcCustomAmount(e.target.value)} placeholder="Nhập VND..." className="w-full bg-slate-50 border-[3px] border-slate-900 rounded-2xl px-6 py-4 focus:border-cyan-500 outline-none font-bold text-xl shadow-[3px_3px_0px_0px_#1E293B]" />}
                        <button onClick={handleMcSubmit} disabled={loading} className="clay-button w-full mt-8 !py-5 !text-xl flex items-center justify-center gap-3">
                          {loading ? <Loader2 className="animate-spin" /> : "TIẾP TỤC"} <ArrowRight className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                      <div className="clay-card p-6">
                        <h3 className="font-black text-sm uppercase flex items-center gap-2 mb-4"><Star className="w-5 h-5 text-yellow-500" /> Auto-Rank</h3>
                        <div className="space-y-3">
                          {MC_AUTO_RANKS.map(r => (
                            <div key={r.rank} className="flex justify-between text-xs font-bold">
                              <span style={{ color: r.color }}>{r.rank}</span>
                              <span className="text-slate-500">{fmtVnd(r.vnd)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {mcStep === "qr" && mcOrder && (
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="clay-card p-6 bg-cyan-500 text-white flex justify-between items-center shadow-[4px_4px_0px_0px_#1E293B]">
                      <div>
                        <div className="text-xs font-black opacity-80">THANH TOÁN</div>
                        <div className="text-3xl font-black">{fmtVnd(mcOrder.amount)}</div>
                      </div>
                      {mcTimeLeft !== null && <div className="font-mono font-black border-2 border-white/30 px-4 py-2 rounded-full">{fmtTime(mcTimeLeft)}</div>}
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="clay-card p-6 space-y-4">
                        <img src={mcOrder.qrUrl} className="w-full border-2 border-slate-900 rounded-xl" />
                        <button onClick={handleDownloadQR} className="w-full py-2 bg-slate-100 border-2 border-slate-900 rounded-xl font-bold text-xs shadow-[2px_2px_0px_0px_#1E293B]">TẢI QR</button>
                      </div>
                      <div className="clay-card p-6 space-y-4">
                        <h3 className="font-black text-sm">THÔNG TIN CHUYỂN KHOẢN</h3>
                        <div className="space-y-3">
                          <Row label="Ngân hàng" value={mcOrder.bankId} />
                          <Row label="Số tài khoản" value={mcOrder.accountNo} mono onCopy={() => handleCopy(mcOrder.accountNo, "acc")} copied={copied === "acc"} />
                          <Row label="Nội dung" value={mcOrder.orderCode} mono highlight onCopy={() => handleCopy(mcOrder.orderCode, "code")} copied={copied === "code"} />
                        </div>
                        <div className="text-xs text-red-600 font-bold bg-red-50 p-3 rounded-xl border-2 border-red-200">Hãy nhập ĐÚNG nội dung để hệ thống tự động cộng xu!</div>
                      </div>
                    </div>
                  </div>
                )}

                {mcStep === "done" && mcOrder && (
                   <div className="max-w-lg mx-auto clay-card p-10 text-center space-y-6">
                     <div className="w-20 h-20 bg-green-100 border-[3px] border-slate-900 rounded-full flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_#1E293B]"><CheckCircle2 className="w-10 h-10 text-green-600" /></div>
                     <h2 className="text-2xl font-black">Nạp thành công!</h2>
                     <div className="bg-slate-900 p-6 rounded-2xl space-y-3">
                       <div className="text-cyan-400 text-xs font-black">MÃ CLAIM NHẬN XU</div>
                       <div className="text-3xl font-black text-white tracking-widest font-mono">{mcClaimCode}</div>
                       <div className="text-xs text-cyan-300 font-mono">/napthe redeem {mcClaimCode}</div>
                     </div>
                     <button onClick={() => setMcStep("form")} className="clay-button w-full">NẠP TIẾP</button>
                   </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
