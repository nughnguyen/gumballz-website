"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Coins, 
  ArrowRight, 
  Settings, 
  Loader2,
  CheckCircle2,
  HelpCircle,
  X,
  User,
  ExternalLink,
  Copy,
  Check,
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
      <span className="text-slate-600 font-bold text-xs uppercase">{label}</span>
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
  const [mcPayosUrl, setMcPayosUrl] = useState("");
  const [mcPayosError, setMcPayosError] = useState("");
  const [mcReviewRequested, setMcReviewRequested] = useState(false);
  const [mcReviewBusy, setMcReviewBusy] = useState(false);
  const [mcReviewMessage, setMcReviewMessage] = useState("");

  const predefinedAmounts = [
    { label: "10k", value: "10000" },
    { label: "20k", value: "20000" },
    { label: "50k", value: "50000" },
    { label: "100k", value: "100000" },
  ];

  // ── Discord Logic ───────────────────────────────────────────
  const handleDiscordDeposit = async () => {
    const recipientId = discordId.trim();
    if (!/^\d{17,20}$/.test(recipientId)) {
      alert("Nhập ID Discord gồm 17–20 chữ số.");
      return;
    }
    const amountNum = Number(discordAmount);
    if (!Number.isSafeInteger(amountNum) || amountNum < 1000 || amountNum > 10000000) {
      alert("Số tiền nạp từ 1.000đ đến 10.000.000đ.");
      return;
    }

    setLoading(true);
    try {
      const content = `GUMZ${recipientId}`;
      const res = await fetch("/api/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          userId: recipientId,
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
    if (!mcOrder || mcStep !== "qr" || mcPollStatus !== "waiting") return;
    const tick = setInterval(() => {
      setMcTimeLeft(prev => {
        if (prev === null) return 600;
        if (prev <= 0) { setMcPollStatus("expired"); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [mcOrder, mcStep, mcPollStatus]);

  useEffect(() => {
    if (!mcOrder || mcStep !== "qr" || mcPollStatus !== "waiting") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/minecraft/claim-status?orderId=${mcOrder.orderId}`);
        const data = await res.json();
        
        // Sync timer with server
        if (data.createdAt && data.serverTime) {
          const expiryMs = data.createdAt + 10 * 60 * 1000;
          const diff = expiryMs - data.serverTime;
          if (diff <= 0) {
            setMcPollStatus("expired");
            setMcTimeLeft(0);
          } else {
            setMcTimeLeft(Math.floor(diff / 1000));
          }
        }

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
    if (!/^[A-Za-z0-9_]{3,16}$/.test(mcPlayerName.trim())) {
      alert("Tên Minecraft phải có 3–16 ký tự, chỉ gồm chữ, số và dấu gạch dưới.");
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
        setMcPayosUrl("");
        setMcPayosError("");
        setMcReviewRequested(false);
        setMcReviewMessage("");
        setMcStep("qr");
        setMcPollStatus("waiting");
        void fetch("/api/payment/create-payos-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionId: data.orderId, content: data.orderCode }),
        }).then(async (response) => {
          const link = await response.json();
          if (response.ok && link.success && link.payable && typeof link.checkoutUrl === "string") setMcPayosUrl(link.checkoutUrl);
          else if (!response.ok) setMcPayosError(link.error || "payOS hiện chưa sẵn sàng.");
        }).catch(() => setMcPayosError("Không kết nối được payOS. Bạn vẫn có thể dùng QR chuyển khoản."));
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

  const requestMinecraftReview = async () => {
    if (!mcOrder) return;
    setMcReviewBusy(true);
    setMcReviewMessage("");
    try {
      const response = await fetch("/api/payment/manual-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: mcOrder.orderId, content: mcOrder.orderCode }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Không gửi được yêu cầu duyệt.");
      setMcReviewRequested(true);
      setMcReviewMessage("Yêu cầu đã gửi. Admin sẽ đối chiếu sao kê trước khi cấp xu.");
    } catch (error) {
      setMcReviewMessage(error instanceof Error ? error.message : "Không gửi được yêu cầu duyệt.");
    } finally {
      setMcReviewBusy(false);
    }
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

      <div className="px-5 pb-20 pt-28 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <Link href="/store" className="inline-flex min-h-11 items-center gap-2 border-[3px] border-slate-900 bg-white px-4 font-black shadow-[3px_3px_0_#111217] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"><ArrowRight className="rotate-180" size={17}/> Quay lại cửa hàng</Link>
            <span className="border-2 border-black bg-[#7FE7D6] px-3 py-2 text-xs font-black">NẠP NHANH · KHÔNG CẦN ĐĂNG NHẬP</span>
          </div>
          
          {/* Header & Tabs */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4">
              Nạp <span className="text-cyan-500">dịch vụ</span>
            </h1>
            <p className="mx-auto mb-7 max-w-2xl text-sm font-semibold leading-6 text-slate-600">Chọn Discord để nạp Coiz vào tài khoản Discord GumballZ bằng ID Discord, hoặc Minecraft để nạp xu bằng tên người chơi. Không cần tạo tài khoản website.</p>
            
            <div className="mx-auto flex w-full max-w-xl flex-col justify-center gap-2 border-[3px] border-slate-900 bg-slate-200/50 p-2 shadow-[4px_4px_0px_0px_#1E293B] sm:w-fit sm:flex-row sm:gap-3">
              <button 
                onClick={() => { setActiveTab("discord"); setMcStep("form"); }}
                className={`flex flex-1 items-center justify-center gap-2 border-2 border-transparent px-3 py-3 text-center text-xs font-black transition-all sm:px-5 sm:text-sm ${
                  activeTab === "discord" 
                  ? "bg-cyan-500 text-white shadow-[2px_2px_0px_0px_#1E293B]" 
                  : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <MessageSquare className="w-4 h-4" /> Nạp Coiz Discord
              </button>
              <button 
                onClick={() => setActiveTab("minecraft")}
                className={`flex flex-1 items-center justify-center gap-2 border-2 border-transparent px-3 py-3 text-center text-xs font-black transition-all sm:px-5 sm:text-sm ${
                  activeTab === "minecraft" 
                  ? "bg-cyan-500 text-white shadow-[2px_2px_0px_0px_#1E293B]" 
                  : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Gamepad2 className="w-4 h-4" /> Minecraft Nạp Xu
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "discord" ? (
              <motion.div 
                key="discord"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                layout
                className="grid min-h-[360px] items-start gap-6 lg:grid-cols-12 lg:gap-8"
              >
                {/* Existing Discord Content */}
                <div className="lg:col-span-8">
                  <div className="clay-card p-8 md:p-10">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                      <Settings className="w-6 h-6 text-cyan-500" /> Nạp Coiz cho Discord
                    </h2>
                    <p className="-mt-5 mb-6 text-sm font-semibold leading-6 text-slate-600">Coiz sẽ được cộng vào tài khoản Discord GumballZ có ID bạn nhập bên dưới. Bạn chỉ cần ID Discord, không cần đăng nhập website.</p>
                    <div className="grid md:grid-cols-2 gap-8 text-left">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-sm font-bold text-slate-700">ID Discord (17–20 chữ số)</label>
                          <button onClick={() => setShowGuide(true)} className="text-[10px] font-black uppercase text-cyan-600 flex items-center gap-1"><HelpCircle className="w-3 h-3" /> Hướng dẫn</button>
                        </div>
                        <input type="text" inputMode="numeric" value={discordId} onChange={(e) => setDiscordId(e.target.value)} placeholder="Nhập ID dạng số" className="w-full bg-slate-50 border-[3px] border-slate-900 rounded-2xl px-6 py-4 focus:border-cyan-500 outline-none text-slate-900 font-mono shadow-[3px_3px_0px_0px_#1E293B]" />
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
                    <p className="text-xs text-slate-500 leading-relaxed">Coiz được nạp cho tài khoản Discord GumballZ theo ID Discord bạn cung cấp, dùng để mua script VIP và đặc quyền trong server.</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="minecraft"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                layout
              >
                {/* Minecraft Step Controller */}
                {mcStep === "form" && (
                  <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-6">
                      <div className="clay-card p-8">
                        <h2 className="text-xl font-black flex items-center gap-2 mb-2"><User className="w-5 h-5 text-cyan-500" /> Tên người chơi Minecraft</h2>
                        <p className="mb-5 text-sm font-semibold leading-6 text-slate-600">Dùng tên nhân vật nhận xu, dài 3–16 ký tự. Không cần đăng nhập tài khoản website.</p>
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
                        <h3 className="font-black text-sm uppercase flex items-center gap-2 mb-4"><Star className="w-5 h-5 text-[#3BA7F2]" /> Auto-Rank</h3>
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
                        <img src={mcOrder.qrUrl} alt="Mã QR thanh toán Minecraft" className="w-full border-2 border-slate-900 rounded-xl" />
                        <button onClick={handleDownloadQR} className="w-full py-2 bg-slate-100 border-2 border-slate-900 rounded-xl font-bold text-xs shadow-[2px_2px_0px_0px_#1E293B]">TẢI QR</button>
                      </div>
                      <div className="clay-card p-6 space-y-4">
                        <h3 className="font-black text-sm">THÔNG TIN CHUYỂN KHOẢN</h3>
                        {mcPayosUrl && <div className="border-[3px] border-slate-900 bg-[#7FE7D6] p-4 shadow-[3px_3px_0_#1e293b]"><p className="text-sm font-black">Thanh toán tự động qua payOS</p><button type="button" onClick={() => location.assign(mcPayosUrl)} className="clay-button mt-3 w-full">Mở payOS để thanh toán <ExternalLink size={15}/></button></div>}
                        {mcPayosError && <p role="status" className="border-2 border-[#0B3D91] bg-[#E8F6FF] p-3 text-xs font-bold">{mcPayosError}</p>}
                        <div className="space-y-3">
                          <Row label="Ngân hàng" value={mcOrder.bankId} />
                          <Row label="Số tài khoản" value={mcOrder.accountNo} mono onCopy={() => handleCopy(mcOrder.accountNo, "acc")} copied={copied === "acc"} />
                          <Row label="Nội dung" value={mcOrder.orderCode} mono highlight onCopy={() => handleCopy(mcOrder.orderCode, "code")} copied={copied === "code"} />
                        </div>
                        <div className="text-xs text-red-600 font-bold bg-red-50 p-3 rounded-xl border-2 border-red-200">Hãy nhập ĐÚNG nội dung để hệ thống tự động cộng xu!</div>
                        {mcReviewRequested ? <p role="status" className="border-[3px] border-slate-900 bg-[#E8F6FF] p-3 text-sm font-bold">Đang chờ Admin duyệt. Xu sẽ được cấp sau khi xác nhận tiền vào.</p> : <button type="button" disabled={mcReviewBusy} onClick={() => void requestMinecraftReview()} className="clay-button w-full disabled:opacity-60">{mcReviewBusy ? "Đang gửi yêu cầu…" : "Đã chuyển khoản ngân hàng khác — nhờ Admin duyệt"}</button>}
                        {mcReviewMessage && <p role="status" className="text-xs font-bold">{mcReviewMessage}</p>}
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
