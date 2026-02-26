"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Copy, Check, ShieldCheck, Loader2, Clock, AlertCircle,
  CreditCard, Download, CheckCircle2, ArrowLeft, Coins
} from "lucide-react";
import Link from "next/link";

const BANK = {
  id:      process.env.NEXT_PUBLIC_BANK_ID      || "OCB",
  account: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO   || "",
  name:    process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "NGUYEN QUOC HUNG",
};

function DetailRow({ label, value, highlight = false, onCopy, copied, isMono = false }: {
  label: string; value: string; highlight?: boolean;
  onCopy?: () => void; copied?: boolean; isMono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-slate-600 text-xs font-bold uppercase">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${highlight ? "text-cyan-500" : "text-slate-900"} ${isMono ? "font-mono" : ""}`}>
            {value}
          </span>
          {onCopy && (
            <button onClick={onCopy} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PayContent() {
  const sp = useSearchParams();
  const orderId    = sp.get("orderId");
  const pluginCode = sp.get("code");
  const pluginAmount = sp.get("amount");

  const [timeLeft,   setTimeLeft]   = useState<number | null>(null);
  const [pollStatus, setPollStatus] = useState<"waiting" | "success" | "expired">("waiting");
  const [claimCode,  setClaimCode]  = useState<string | null>(null);
  const [copied,     setCopied]     = useState("");
  const [loadErr,    setLoadErr]    = useState("");
  const [firstFetchDone, setFirstFetchDone] = useState(false);

  const amtNum = pluginAmount ? parseInt(pluginAmount) : 0;
  const formattedAmount = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amtNum);

  const qrUrl = pluginCode && pluginAmount
    ? `https://img.vietqr.io/image/${BANK.id.toLowerCase()}-${BANK.account}-qr_only.png?amount=${pluginAmount}&addInfo=${pluginCode}&accountName=${encodeURIComponent(BANK.name)}`
    : null;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };
  const handleDownloadQR = async () => {
    if (!qrUrl) return;
    try {
      const blob = await fetch(qrUrl).then(r => r.blob());
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `QR-${pluginCode}-${pluginAmount}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  // ── process API response ────────────────────────────────────────
  function processResponse(d: any) {
    if (d.createdAt && d.serverTime) {
      const expiryMs = d.createdAt + 10 * 60 * 1000;
      const nowMs    = Date.now() + (d.serverTime - Date.now());
      const diff     = Math.max(0, expiryMs - nowMs);
      setTimeLeft(Math.floor(diff / 1000));
    }
    if (d.status === "expired") { setPollStatus("expired"); setTimeLeft(0); return; }
    if (d.success && d.status === "paid") {
      setClaimCode(d.claimCode ?? null);
      setPollStatus("success");
    }
  }

  // ── First fetch on mount (fixes F5 timer reset) ───────────────────
  useEffect(() => {
    if (!orderId && !pluginCode) return;
    const query = orderId ? `orderId=${orderId}` : `code=${pluginCode}`;
    fetch(`/api/minecraft/claim-status?${query}`)
      .then(r => r.json())
      .then(d => { processResponse(d); setFirstFetchDone(true); })
      .catch(() => { setFirstFetchDone(true); setLoadErr("Không kết nối được server"); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Countdown (only after first fetch) ───────────────────────────
  useEffect(() => {
    if (!firstFetchDone || pollStatus !== "waiting" || timeLeft === null || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(p => (!p || p <= 1) ? (setPollStatus("expired"), 0) : p - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstFetchDone, timeLeft, pollStatus]);

  // ── Poll every 4 s ─────────────────────────────────────────────────
  useEffect(() => {
    if (!firstFetchDone || pollStatus !== "waiting") return;
    const query = orderId ? `orderId=${orderId}` : `code=${pluginCode}`;
    const iv = setInterval(async () => {
      try {
        const d = await fetch(`/api/minecraft/claim-status?${query}`).then(r => r.json());
        processResponse(d);
        if (d.status === "paid" || d.status === "expired") clearInterval(iv);
      } catch { /* ignore */ }
    }, 4000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstFetchDone, pollStatus]);

  // ── No params ──────────────────────────────────────────────────────
  if (!orderId && !pluginCode) {
    return (
      <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center px-4">
        <div className="clay-card p-10 text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Trang không hợp lệ</h2>
          <p className="text-slate-500 mb-6">Dùng lệnh /napthe trong game để tạo đơn mới.</p>
          <Link href="/minecraft/store" className="clay-button flex items-center justify-center gap-2">
            <Coins className="w-4 h-4" /> Đến cửa hàng
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = pollStatus === "expired";

  return (
    <div className="min-h-screen bg-[#FFF9F5] pt-28 pb-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* ── Success State ─────────────────────────────────────── */}
          {pollStatus === "success" ? (
            <div className="max-w-[732px] mx-auto">
              <div className="clay-card p-10 text-center space-y-6">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 bg-green-100 border-[3px] border-slate-900 rounded-full flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_#1E293B]"
                >
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Thanh toán thành công!</h2>
                  <p className="text-slate-600 font-medium">Hệ thống đã xác nhận giao dịch của bạn</p>
                </div>

                {claimCode && (
                  <div className="clay-card p-6 bg-gradient-to-br from-cyan-50 to-white space-y-4 text-left">
                    <div className="flex items-center gap-2 text-cyan-600 font-bold">
                      <Coins className="w-5 h-5" /> Mã nhận xu của bạn
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-grow bg-slate-100 border-[3px] border-slate-900 p-4 rounded-xl font-mono text-lg font-black text-slate-900 shadow-[2px_2px_0px_0px_#1E293B]">
                        {claimCode}
                      </div>
                      <button
                        onClick={() => handleCopy(claimCode, "c")}
                        className="p-4 bg-cyan-500 border-[3px] border-slate-900 rounded-xl text-white shadow-[3px_3px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px transition-all"
                      >
                        {copied === "c" ? <Check /> : <Copy />}
                      </button>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-3 text-center">
                      <code className="text-cyan-300 font-mono text-sm">
                        /napthe redeem <span className="text-yellow-300 font-black">{claimCode}</span>
                      </code>
                    </div>
                    <p className="text-xs text-slate-500 font-bold text-center">Nhập lệnh trên vào chat trong game để nhận xu</p>
                  </div>
                )}

                {!claimCode && (
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                    <p className="text-green-700 font-semibold text-sm">Xu đã được cộng vào tài khoản trong game của bạn!</p>
                  </div>
                )}

                <Link href="/store" className="clay-button flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Nạp thêm
                </Link>
              </div>
            </div>
          ) : (
            /* ── Waiting / Expired State ────────────────────────────── */
            <>
              {/* 2-column grid: QR left | Bank info right */}
              <div className="grid lg:grid-cols-2 gap-8 items-start max-w-[732px] mx-auto">

                {/* Left: QR Code */}
                <div className="space-y-4">
                  <div className="clay-card p-8 space-y-4">
                    <h3 className="font-black text-slate-900 text-lg text-center flex items-center justify-center gap-2">
                      <CreditCard className="w-5 h-5 text-cyan-500" />
                      Mã QR Thanh Toán
                    </h3>

                    {qrUrl ? (
                      <>
                        <motion.div
                          className="relative"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className={`p-4 bg-white border-[3px] border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer ${isExpired ? "opacity-20 grayscale" : ""}`}>
                            <img src={qrUrl} alt="QR thanh toán" className="w-full h-auto object-contain" />
                          </div>
                          {isExpired && (
                            <motion.div
                              className="absolute inset-0 flex items-center justify-center"
                              initial={{ scale: 0, rotate: 0 }}
                              animate={{ scale: 1, rotate: -12 }}
                              transition={{ type: "spring", stiffness: 200 }}
                            >
                              <span className="bg-red-500 text-white font-black px-6 py-3 rounded-xl border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_#1E293B] tracking-widest">
                                HẾT HẠN
                              </span>
                            </motion.div>
                          )}
                        </motion.div>

                        {!isExpired && (
                          <motion.button
                            onClick={handleDownloadQR}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 bg-slate-100 border-[3px] border-slate-900 rounded-xl font-bold text-slate-900 shadow-[3px_3px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px transition-all flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" /> Tải mã QR
                          </motion.button>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Bank / Transfer Info */}
                <div className={`clay-card p-5 space-y-6 ${isExpired ? "opacity-30" : ""}`}>
                  <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-500" />
                    Thông Tin Chuyển Khoản
                  </h3>

                  <div className="space-y-4">
                    <DetailRow label="Ngân hàng"     value={BANK.id}      />
                    <DetailRow label="Chủ tài khoản" value={BANK.name}    />
                    <DetailRow
                      label="Số tài khoản"
                      value={BANK.account}
                      onCopy={() => handleCopy(BANK.account, "acc")}
                      copied={copied === "acc"}
                      isMono
                    />

                    <div className="border-t-2 border-dashed border-slate-200 pt-4">
                      <DetailRow
                        label="Nội dung CK"
                        value={pluginCode ?? ""}
                        highlight
                        onCopy={() => handleCopy(pluginCode!, "code")}
                        copied={copied === "code"}
                        isMono
                      />
                      <div className="mt-2 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                        <p className="text-xs text-red-700 font-bold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Nhập chính xác nội dung để được cộng xu tự động
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-2">
                    {isExpired ? (
                      <div className="inline-flex items-center gap-2 text-red-600 font-bold">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">Đơn hàng đã hết hạn. Tạo lại trong game!</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 text-slate-700 font-bold">
                        <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                        <span className="text-sm">Đang chờ thanh toán...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount Banner - Full width */}
              <div className="clay-card p-6 bg-linear-to-br from-cyan-400 to-cyan-500 relative overflow-hidden max-w-[732px] mx-auto">
                <div className="relative z-10 flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="text-slate-900/60 text-xs font-black uppercase tracking-wider mb-1">Số tiền thanh toán</div>
                    <div className="text-4xl md:text-5xl font-black text-slate-900">{formattedAmount}</div>
                  </div>

                  {timeLeft !== null && (
                    <div className="flex items-center gap-2 bg-white/30 backdrop-blur-md px-4 py-3 rounded-full border-2 border-slate-900/10">
                      <Clock className={`w-4 h-4 ${timeLeft < 60 ? "text-red-600 animate-pulse" : "text-slate-900"}`} />
                      <span className="text-xs font-bold text-slate-900/60">Hết hạn sau:</span>
                      <span className="font-mono font-black text-slate-900 text-lg">{formatTime(timeLeft)}</span>
                    </div>
                  )}
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              </div>
            </>
          )}
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="clay-card inline-block px-6 py-3">
            <p className="text-slate-500 text-xs font-mono">
              Mã đơn hàng: <span className="text-slate-900 font-bold">{pluginCode}</span>
            </p>
          </div>
        </div>

        {loadErr && (
          <p className="text-center text-sm text-red-500 mt-4 font-bold">{loadErr}</p>
        )}
      </div>
    </div>
  );
}

export default function MinecraftPayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center">
        <div className="clay-card px-8 py-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            <span className="font-bold text-slate-900">Đang tải...</span>
          </div>
        </div>
      </div>
    }>
      <PayContent />
    </Suspense>
  );
}
