"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense } from "react";
import {
  Coins, Loader2, CheckCircle2, Copy, Check,
  Clock, AlertCircle, ArrowRight, Gift, User,
  Download, Star, Zap
} from "lucide-react";

const PACKAGES = [
  { id: "20k", label: "20.000đ", vnd: 20000, xu: 20000, bonus: 0 },
  { id: "50k", label: "50.000đ", vnd: 50000, xu: 50000, bonus: 0 },
  { id: "100k", label: "100.000đ", vnd: 100000, xu: 110000, bonus: 10 },
  { id: "200k", label: "200.000đ", vnd: 200000, xu: 240000, bonus: 20 },
  { id: "500k", label: "500.000đ", vnd: 500000, xu: 650000, bonus: 30 },
];

const AUTO_RANKS = [
  { vnd: 50000, rank: "VIP", color: "#f59e0b" },
  { vnd: 150000, rank: "VIP+", color: "#f97316" },
  { vnd: 350000, rank: "LEGEND", color: "#ef4444" },
  { vnd: 700000, rank: "GOD", color: "#a855f7" },
];

type Step = "form" | "qr" | "done";

interface OrderInfo {
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

function MinecraftStoreContent() {
  const [playerName, setPlayerName] = useState("");
  const [selectedPkg, setSelectedPkg] = useState<typeof PACKAGES[0] | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [claimCode, setClaimCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [copied, setCopied] = useState("");
  const [pollStatus, setPollStatus] = useState<"waiting" | "success" | "expired">("waiting");

  // Countdown timer
  useEffect(() => {
    if (!order || step !== "qr") return;
    const expiryMs = order.expiry * 1000;
    const tick = setInterval(() => {
      const diff = expiryMs - Date.now();
      if (diff <= 0) {
        setTimeLeft(0);
        setPollStatus("expired");
        clearInterval(tick);
      } else {
        setTimeLeft(Math.floor(diff / 1000));
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [order, step]);

  // Poll for payment
  useEffect(() => {
    if (!order || step !== "qr" || pollStatus !== "waiting") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/minecraft/claim-status?orderId=${order.orderId}`);
        const data = await res.json();
        if (data.success && data.status === "paid") {
          setClaimCode(data.claimCode);
          setPollStatus("success");
          setStep("done");
          clearInterval(interval);
        }
      } catch { /* ignore */ }
    }, 4000);
    return () => clearInterval(interval);
  }, [order, step, pollStatus]);

  const getAmount = () => {
    if (useCustom) return parseInt(customAmount) || 0;
    return selectedPkg?.vnd || 0;
  };

  const getRewardXu = () => {
    if (useCustom) return parseInt(customAmount) || 0;
    return selectedPkg?.xu || 0;
  };

  const handleSubmit = async () => {
    if (!playerName.trim() || playerName.trim().length < 3) {
      alert("Nhập tên Minecraft (tối thiểu 3 ký tự)");
      return;
    }
    const amt = getAmount();
    if (amt < 10000) {
      alert("Số tiền tối thiểu 10.000đ");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/minecraft/web-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: playerName.trim(), amountVnd: amt, rewardXu: getRewardXu() })
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data);
        setStep("qr");
        setPollStatus("waiting");
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
    if (!order) return;
    try {
      const res = await fetch(order.qrUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `QR-${order.orderCode}.png`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { alert("Không tải được QR"); }
  };

  const fmt = (n: number) => n.toLocaleString("vi-VN") + "đ";
  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FFF9F5] pt-28 pb-20 px-4">
      <div className="container mx-auto max-w-5xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4 bg-cyan-100 border-2 border-slate-900 px-5 py-2 rounded-full shadow-[3px_3px_0px_0px_#1E293B]">
            <Coins className="w-5 h-5 text-cyan-600" />
            <span className="font-black text-slate-800 uppercase tracking-wider text-sm">Minecraft Shop</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3 leading-tight">
            Nạp Xu <span className="text-cyan-500">GumballZ</span>
          </h1>
          <p className="text-slate-500 font-medium">Nạp tiền nhận xu in-game • Tự động lên rank theo mốc</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ── STEP: FORM ─────────────────────────────────── */}
          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }} className="grid lg:grid-cols-12 gap-8">

              {/* Left: Form */}
              <div className="lg:col-span-8 space-y-6">
                {/* Player Name */}
                <div className="clay-card p-8">
                  <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-500" /> Tên Nhân Vật Minecraft
                  </h2>
                  <input
                    type="text" value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="VD: Steve, Notch, HungNguyen..."
                    className="w-full bg-slate-50 border-[3px] border-slate-900 rounded-2xl px-6 py-4 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all text-slate-900 font-bold text-lg shadow-[3px_3px_0px_0px_#1E293B] font-mono"
                  />
                  <p className="text-xs text-slate-400 mt-2 font-medium">
                    Viết đúng chính xác (phân biệt hoa thường). Nếu chưa từng vào server, bạn sẽ nhận mã code để dùng sau.
                  </p>
                </div>

                {/* Package Grid */}
                <div className="clay-card p-8">
                  <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-cyan-500" /> Chọn Gói Nạp
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {PACKAGES.map((pkg) => (
                      <button key={pkg.id}
                        onClick={() => { setSelectedPkg(pkg); setUseCustom(false); }}
                        className={`relative p-4 rounded-2xl border-[3px] text-left transition-all ${
                          !useCustom && selectedPkg?.id === pkg.id
                            ? "bg-cyan-500 border-slate-900 text-white shadow-[4px_4px_0px_0px_#1E293B]"
                            : "bg-white border-slate-900 text-slate-700 hover:bg-cyan-50 shadow-[3px_3px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px"
                        }`}>
                        {pkg.bonus > 0 && (
                          <span className={`absolute -top-2 -right-2 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-slate-900 ${
                            !useCustom && selectedPkg?.id === pkg.id ? "bg-yellow-300 text-slate-900" : "bg-yellow-400 text-slate-900"}`}>
                            +{pkg.bonus}%
                          </span>
                        )}
                        <div className="font-black text-lg">{pkg.label}</div>
                        <div className={`text-sm font-bold mt-1 ${!useCustom && selectedPkg?.id === pkg.id ? "text-cyan-100" : "text-cyan-600"}`}>
                          {pkg.xu.toLocaleString("vi-VN")} xu
                        </div>
                      </button>
                    ))}

                    {/* Custom amount card */}
                    <button onClick={() => { setUseCustom(true); setSelectedPkg(null); }}
                      className={`p-4 rounded-2xl border-[3px] text-left transition-all ${
                        useCustom
                          ? "bg-cyan-500 border-slate-900 text-white shadow-[4px_4px_0px_0px_#1E293B]"
                          : "bg-white border-slate-900 text-slate-700 hover:bg-cyan-50 shadow-[3px_3px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px"
                      }`}>
                      <div className="font-black text-lg">Tùy chỉnh</div>
                      <div className={`text-sm font-bold mt-1 ${useCustom ? "text-cyan-100" : "text-slate-400"}`}>Nhập số tiền</div>
                    </button>
                  </div>

                  {useCustom && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="relative">
                      <input
                        type="number" value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Nhập số tiền VND..."
                        className="w-full bg-slate-50 border-[3px] border-slate-900 rounded-2xl px-6 py-4 pr-20 focus:border-cyan-500 outline-none transition-all text-slate-900 font-bold text-xl shadow-[3px_3px_0px_0px_#1E293B]"
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">VNĐ</div>
                    </motion.div>
                  )}

                  <button
                    onClick={handleSubmit} disabled={loading}
                    className="clay-button w-full mt-8 !py-5 !text-xl flex items-center justify-center gap-3 group disabled:opacity-50">
                    {loading
                      ? <><Loader2 className="animate-spin" /> Đang tạo đơn...</>
                      : <><span>TẠO QR THANH TOÁN</span><ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" /></>
                    }
                  </button>
                </div>
              </div>

              {/* Right: Info */}
              <div className="lg:col-span-4 space-y-5">
                {/* Steps */}
                <div className="clay-card p-6">
                  <h3 className="font-black text-slate-900 mb-5 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500" /> Quy trình
                  </h3>
                  <ul className="space-y-4">
                    {[
                      "Nhập tên Minecraft & chọn gói",
                      "Quét mã QR để thanh toán",
                      "Nhận mã claim → gõ /napthe redeem <mã> trong game",
                      "Xu tự động cộng • Đủ mốc → tự lên rank!"
                    ].map((text, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="w-7 h-7 shrink-0 rounded-full bg-cyan-500 border-2 border-slate-900 text-white flex items-center justify-center font-bold text-xs">{i + 1}</span>
                        <p className="text-slate-600 text-sm leading-relaxed">{text}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Auto-rank thresholds */}
                <div className="clay-card p-6">
                  <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Star className="w-5 h-5 text-yellow-500" /> Mốc Auto-Rank
                  </h3>
                  <div className="space-y-3">
                    {AUTO_RANKS.map((r) => (
                      <div key={r.rank} className="flex items-center justify-between">
                        <span className="font-black text-sm" style={{ color: r.color }}>{r.rank}</span>
                        <span className="text-xs text-slate-500 font-bold">{fmt(r.vnd)} tích lũy</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-4 leading-relaxed">Rank cấp vĩnh viễn khi đủ tổng tiền nạp tích lũy.</p>
                </div>

                {/* Gift code */}
                <div className="clay-card p-6 bg-gradient-to-br from-purple-50 to-white">
                  <h3 className="font-black text-slate-900 mb-2 flex items-center gap-2 text-sm">
                    <Gift className="w-5 h-5 text-purple-500" /> Có mã Gift Code?
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Dùng lệnh <code className="bg-slate-100 px-1 rounded font-mono text-slate-800">/napthe redeem GZXXXXXX</code> trong game để đổi.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP: QR ───────────────────────────────────── */}
          {step === "qr" && order && (
            <motion.div key="qr" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} className="max-w-2xl mx-auto space-y-6">

              {/* Amount banner */}
              <div className="clay-card p-6 bg-gradient-to-br from-cyan-500 to-cyan-600 relative overflow-hidden">
                <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-cyan-100 text-xs font-black uppercase tracking-widest mb-1">Số tiền thanh toán</div>
                    <div className="text-4xl font-black text-white">{fmt(order.amount)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-cyan-100 text-xs font-black uppercase tracking-widest mb-1">Nhận được</div>
                    <div className="text-2xl font-black text-white">{order.rewardXu.toLocaleString("vi-VN")} xu</div>
                  </div>
                  {timeLeft !== null && (
                    <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full border-2 border-white/30">
                      <Clock className={`w-4 h-4 ${timeLeft < 60 ? "text-red-200 animate-pulse" : "text-white"}`} />
                      <span className="font-mono font-black text-white">{fmtTime(timeLeft)}</span>
                    </div>
                  )}
                </div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* QR Code */}
                <div className="clay-card p-6 space-y-4">
                  <h3 className="font-black text-slate-900 text-center flex items-center justify-center gap-2">
                    Mã QR Thanh Toán
                  </h3>
                  <div className={`p-3 bg-white border-[3px] border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_#1E293B] ${pollStatus === "expired" ? "opacity-30 grayscale" : ""}`}>
                    <img src={order.qrUrl} alt="QR" className="w-full h-auto" />
                  </div>
                  {pollStatus === "expired" && (
                    <div className="text-center text-red-600 font-black">⏰ Đơn hàng đã hết hạn</div>
                  )}
                  {pollStatus !== "expired" && (
                    <button onClick={handleDownloadQR}
                      className="w-full py-3 bg-slate-100 border-[3px] border-slate-900 rounded-xl font-bold text-slate-700 shadow-[3px_3px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px transition-all flex items-center justify-center gap-2 text-sm">
                      <Download className="w-4 h-4" /> Tải QR
                    </button>
                  )}
                </div>

                {/* Bank details */}
                <div className="clay-card p-6 space-y-4">
                  <h3 className="font-black text-slate-900 flex items-center gap-2">Thông Tin CK</h3>
                  <div className="space-y-3 text-sm">
                    <Row label="Ngân hàng" value={order.bankId} />
                    <Row label="Chủ tài khoản" value={order.accountName} />
                    <Row label="Số tài khoản" value={order.accountNo} mono
                      onCopy={() => handleCopy(order.accountNo, "acc")} copied={copied === "acc"} />
                    <div className="border-t-2 border-dashed border-slate-200 pt-3">
                      <Row label="Nội dung CK" value={order.orderCode} mono highlight
                        onCopy={() => handleCopy(order.orderCode, "code")} copied={copied === "code"} />
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                    <p className="text-xs text-red-700 font-bold flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      Nhập ĐÚNG nội dung chuyển khoản để hệ thống tự xác nhận!
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                      <span className="text-sm font-medium">Đang chờ thanh toán...</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="clay-card p-4 text-center text-xs text-slate-400 font-mono">
                Order: {order.orderCode} | Player: {order.playerName}
              </div>
            </motion.div>
          )}

          {/* ── STEP: DONE ─────────────────────────────────── */}
          {step === "done" && order && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto">
              <div className="clay-card p-10 text-center space-y-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }}>
                  <div className="w-24 h-24 bg-green-100 border-[4px] border-slate-900 rounded-full flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#1E293B]">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                </motion.div>

                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2">Thanh toán thành công!</h2>
                  <p className="text-slate-500">Hệ thống đã xác nhận giao dịch của bạn.</p>
                </div>

                {claimCode && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="clay-card p-6 bg-gradient-to-br from-cyan-50 to-white space-y-4">
                    <div className="flex items-center gap-2 text-cyan-600 font-black text-sm">
                      <Zap className="w-4 h-4" /> MÃ NHẬN XU TRONG GAME
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-grow bg-slate-900 p-4 rounded-xl font-mono text-2xl font-black text-cyan-400 text-center tracking-widest shadow-inner">
                        {claimCode}
                      </div>
                      <button onClick={() => handleCopy(claimCode, "claim")}
                        className="p-4 bg-cyan-500 border-[3px] border-slate-900 rounded-xl text-white shadow-[3px_3px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px transition-all">
                        {copied === "claim" ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="p-4 bg-slate-900 rounded-xl">
                      <p className="text-cyan-300 text-sm font-mono text-center">
                        /napthe redeem <span className="text-yellow-300 font-black">{claimCode}</span>
                      </p>
                    </div>
                    <p className="text-sm text-slate-500">
                      Vào Minecraft và dùng lệnh trên để nhận <strong>{order.rewardXu.toLocaleString("vi-VN")} xu</strong>.
                      Mã dùng 1 lần duy nhất.
                    </p>
                  </motion.div>
                )}

                <button onClick={() => { setStep("form"); setOrder(null); setClaimCode(null); setPlayerName(""); setSelectedPkg(null); setCustomAmount(""); }}
                  className="clay-button w-full">
                  Nạp thêm
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Sub-component ──
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

export default function MinecraftStorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center">
        <div className="clay-card px-8 py-4 flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
          <span className="font-bold text-slate-900">Đang tải...</span>
        </div>
      </div>
    }>
      <MinecraftStoreContent />
    </Suspense>
  );
}
