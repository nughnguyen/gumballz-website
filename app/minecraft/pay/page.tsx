"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Copy, Check, Clock, Loader2, AlertCircle, ArrowLeft,
  Coins, Shield, Zap, QrCode, ExternalLink
} from "lucide-react";
import Link from "next/link";

/* ─── Discord-style design tokens ─────────────────────────────── */
const C = {
  bg:        "#23272a",
  surface:   "#2c2f33",
  elevated:  "#36393f",
  border:    "#40444b",
  blurple:   "#5865F2",
  blurpleHover: "#4752c4",
  green:     "#3ba55d",
  red:       "#ed4245",
  yellow:    "#faa61a",
  textPrimary: "#dcddde",
  textSecondary: "#b9bbbe",
  textMuted: "#72767d",
};

function PayContent() {
  const sp = useSearchParams();
  const orderId    = sp.get("orderId");   // present in both plugin (new) and web flows
  const pluginCode = sp.get("code");      // always present — the MC order code
  const pluginAmount = sp.get("amount");

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const serverOffsetRef = useRef<number>(0); // ms difference between server & client clocks
  const [pollStatus, setPollStatus] = useState<"waiting" | "success" | "expired">("waiting");
  const [claimCode, setClaimCode] = useState<string | null>(null);
  const [rewardValue, setRewardValue] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  const [loadErr, setLoadErr] = useState("");
  const [firstFetchDone, setFirstFetchDone] = useState(false);

  const bankId      = process.env.NEXT_PUBLIC_BANK_ID || "OCB";
  const accountNo   = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO || "";
  const accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "";

  const qrUrl = pluginCode && pluginAmount
    ? `https://img.vietqr.io/image/${bankId.toLowerCase()}-${accountNo}-qr_only.png?amount=${pluginAmount}&addInfo=${pluginCode}&accountName=${encodeURIComponent(accountName)}`
    : null;

  const amtNum = pluginAmount ? parseInt(pluginAmount) : 0;

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  // ── Helper: process a claim-status API response ───────────────────
  function processResponse(d: any) {
    // Sync timer using server timestamps (persists across F5)
    if (d.createdAt && d.serverTime) {
      serverOffsetRef.current = d.serverTime - Date.now(); // calibrate client ↔ server
      const expiryMs = d.createdAt + 10 * 60 * 1000;
      const nowMs = Date.now() + serverOffsetRef.current;
      const diff = Math.max(0, expiryMs - nowMs);
      setTimeLeft(Math.floor(diff / 1000));
    }

    if (d.status === "expired") {
      setPollStatus("expired");
      setTimeLeft(0);
      return;
    }

    if (d.success && d.status === "paid") {
      setClaimCode(d.claimCode ?? null);
      setRewardValue(d.rewardValue ?? null);
      setPollStatus("success");
    }
  }

  // ── First fetch immediately on mount (fixes F5 reset) ───────────
  useEffect(() => {
    if (!orderId && !pluginCode) return;
    const query = orderId ? `orderId=${orderId}` : `code=${pluginCode}`;
    fetch(`/api/minecraft/claim-status?${query}`)
      .then(r => r.json())
      .then(d => { processResponse(d); setFirstFetchDone(true); })
      .catch(() => { setFirstFetchDone(true); setLoadErr("Không kết nối được server"); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Countdown tick (only after first fetch to avoid 600-default) ──
  useEffect(() => {
    if (!firstFetchDone || pollStatus !== "waiting" || timeLeft === null) return;
    if (timeLeft <= 0) { setPollStatus("expired"); return; }
    const t = setTimeout(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 0) { setPollStatus("expired"); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstFetchDone, timeLeft, pollStatus]);

  // ── Poll every 4 s ────────────────────────────────────────────────
  useEffect(() => {
    if (!firstFetchDone || pollStatus !== "waiting") return;
    const query = orderId ? `orderId=${orderId}` : `code=${pluginCode}`;
    const iv = setInterval(async () => {
      try {
        const r = await fetch(`/api/minecraft/claim-status?${query}`);
        const d = await r.json();
        processResponse(d);
        if (d.status === "paid" || d.status === "expired") clearInterval(iv);
      } catch { /* ignore */ }
    }, 4000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstFetchDone, pollStatus]);

  // ── No params → invalid page ──────────────────────────────────────
  if (!orderId && !pluginCode) {
    return (
      <div style={{ background: C.bg }} className="min-h-screen flex items-center justify-center px-4">
        <div style={{ background: C.surface, border: `1px solid ${C.border}` }} className="rounded-2xl p-8 text-center max-w-sm w-full">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: C.red }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: C.textPrimary }}>Trang không hợp lệ</h2>
          <p className="text-sm mb-6" style={{ color: C.textSecondary }}>Đến cửa hàng Minecraft để tạo đơn hàng mới.</p>
          <Link href="/minecraft/store"
            className="flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg font-semibold text-sm transition-colors text-white"
            style={{ background: C.blurple }}>
            <Coins className="w-4 h-4" /> Đến cửa hàng
          </Link>
        </div>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────
  if (pollStatus === "success") {
    return (
      <div style={{ background: C.bg }} className="min-h-screen flex items-center justify-center px-4 py-12">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
            className="rounded-2xl p-8 text-center max-w-sm w-full space-y-6"
          >
            {/* Animated check */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", damping: 12, stiffness: 400 }}
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{ background: `${C.green}20`, border: `2px solid ${C.green}` }}
            >
              <CheckCircle2 className="w-10 h-10" style={{ color: C.green }} />
            </motion.div>

            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: C.textPrimary }}>Thanh toán thành công!</h2>
              <p className="text-sm" style={{ color: C.textSecondary }}>
                Hệ thống đã xác nhận giao dịch của bạn.
              </p>
            </div>

            {claimCode && (
              <div className="rounded-xl p-4 space-y-3" style={{ background: C.elevated, border: `1px solid ${C.border}` }}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.textMuted }}>Mã nhận xu</p>
                <div className="relative flex items-center justify-center">
                  <code className="text-2xl font-bold tracking-widest font-mono" style={{ color: C.blurple }}>{claimCode}</code>
                  <button onClick={() => handleCopy(claimCode, "c")}
                    className="absolute right-0 p-1.5 rounded-lg transition-colors"
                    style={{ background: copied === "c" ? `${C.green}30` : C.border }}>
                    {copied === "c" ? <Check className="w-4 h-4" style={{ color: C.green }} /> : <Copy className="w-4 h-4" style={{ color: C.textSecondary }} />}
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 p-2 rounded-lg" style={{ background: C.bg }}>
                  <code className="text-sm font-mono" style={{ color: C.textSecondary }}>
                    /napthe redeem <span style={{ color: C.yellow }} className="font-bold">{claimCode}</span>
                  </code>
                  <button onClick={() => handleCopy(`/napthe redeem ${claimCode}`, "cmd")}
                    className="p-1 rounded transition-colors" style={{ color: copied === "cmd" ? C.green : C.textMuted }}>
                    {copied === "cmd" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs" style={{ color: C.textMuted }}>Nhập lệnh trên vào chat trong game để nhận xu</p>
              </div>
            )}

            {!claimCode && (
              <div className="rounded-xl p-4" style={{ background: `${C.green}15`, border: `1px solid ${C.green}40` }}>
                <p className="text-sm font-semibold" style={{ color: C.green }}>
                  Plugin đã nhận được xác nhận. Xu sẽ được cộng vào tài khoản trong game của bạn!
                </p>
              </div>
            )}

            <Link href="/store"
              className="flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg font-semibold text-sm w-full transition-opacity hover:opacity-80 text-white"
              style={{ background: C.blurple }}>
              <ArrowLeft className="w-4 h-4" /> Nạp thêm
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── Waiting / Expired state ───────────────────────────────────────
  const progressPct = timeLeft !== null ? Math.max(0, (timeLeft / 600) * 100) : 100;
  const progressColor = timeLeft !== null
    ? (timeLeft > 180 ? C.green : timeLeft > 60 ? C.yellow : C.red)
    : C.blurple;

  return (
    <div style={{ background: C.bg }} className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-3">

        {/* Header banner */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: C.blurple }}>
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight" style={{ color: C.textPrimary }}>Thanh toán GumballZ</h1>
            <p className="text-xs" style={{ color: C.textMuted }}>Chuyển khoản ngân hàng • VietQR</p>
          </div>
        </div>

        {/* Amount + timer card */}
        <div className="rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: C.textMuted }}>Số tiền thanh toán</p>
              <p className="text-3xl font-bold" style={{ color: C.textPrimary }}>
                {amtNum.toLocaleString("vi-VN")}đ
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: C.textMuted }}>Hết hạn sau</p>
              {timeLeft === null ? (
                <Loader2 className="w-5 h-5 animate-spin ml-auto" style={{ color: C.textMuted }} />
              ) : (
                <p className="text-2xl font-bold font-mono" style={{ color: progressColor }}>
                  {fmtTime(timeLeft)}
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: progressColor }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>
        </div>

        {/* Expired state */}
        <AnimatePresence>
          {pollStatus === "expired" && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: `${C.red}15`, border: `1px solid ${C.red}40` }}>
              <AlertCircle className="w-5 h-5 shrink-0" style={{ color: C.red }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: C.red }}>Đơn hàng đã hết hạn</p>
                <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>Vui lòng dùng lệnh <code className="font-mono">/napthe</code> trong game để tạo đơn mới.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* QR code + bank info */}
        {qrUrl && pollStatus === "waiting" && (
          <div className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            {/* QR */}
            <div className="p-5 flex flex-col items-center gap-3" style={{ background: C.elevated }}>
              <div className="w-full max-w-[220px] rounded-xl overflow-hidden bg-white p-3">
                <img src={qrUrl} alt="QR thanh toán" className="w-full h-auto" />
              </div>
              <p className="text-xs" style={{ color: C.textMuted }}>Quét mã QR bằng ứng dụng ngân hàng</p>
            </div>

            {/* Bank details */}
            <div className="p-4 space-y-3">
              {[
                { label: "Ngân hàng", value: bankId, copyKey: "" },
                { label: "Số tài khoản", value: accountNo, copyKey: "acc" },
              ].map(({ label, value, copyKey }) => (
                <div key={label} className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-sm" style={{ color: C.textPrimary }}>{value}</span>
                    {copyKey && (
                      <button onClick={() => handleCopy(value, copyKey)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ background: copied === copyKey ? `${C.green}30` : C.border }}>
                        {copied === copyKey ? <Check className="w-3.5 h-3.5" style={{ color: C.green }} /> : <Copy className="w-3.5 h-3.5" style={{ color: C.textSecondary }} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Transfer content — most important */}
              <div className="rounded-xl p-3" style={{ background: `${C.blurple}15`, border: `1px solid ${C.blurple}50` }}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: C.textMuted }}>Nội dung chuyển khoản</p>
                    <p className="text-xl font-bold font-mono" style={{ color: C.blurple }}>{pluginCode}</p>
                  </div>
                  <button onClick={() => handleCopy(pluginCode!, "code")}
                    className="flex items-center gap-1.5 py-2 px-3 rounded-lg font-semibold text-xs transition-colors text-white"
                    style={{ background: copied === "code" ? C.green : C.blurple }}>
                    {copied === "code" ? <><Check className="w-3.5 h-3.5" /> Đã copy</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </button>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: `${C.yellow}15`, border: `1px solid ${C.yellow}40` }}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.yellow }} />
                <p className="text-xs font-medium" style={{ color: C.yellow }}>
                  Nhập <strong>ĐÚNG NỘI DUNG</strong> chuyển khoản để hệ thống tự động xác nhận!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Waiting indicator */}
        {pollStatus === "waiting" && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div className="relative">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: C.blurple, borderTopColor: "transparent" }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: C.textPrimary }}>Đang chờ xác nhận thanh toán...</p>
              <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>Hệ thống tự động kiểm tra mỗi 4 giây</p>
            </div>
          </div>
        )}

        {/* Security badges */}
        <div className="flex items-center justify-center gap-4 pt-2">
          {[
            { icon: <Shield className="w-3.5 h-3.5" />, label: "Bảo mật" },
            { icon: <Zap className="w-3.5 h-3.5" />, label: "Tự động" },
            { icon: <QrCode className="w-3.5 h-3.5" />, label: "VietQR" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span style={{ color: C.textMuted }}>{icon}</span>
              <span className="text-xs" style={{ color: C.textMuted }}>{label}</span>
            </div>
          ))}
        </div>

        {loadErr && (
          <p className="text-center text-xs" style={{ color: C.red }}>{loadErr}</p>
        )}
      </div>
    </div>
  );
}

export default function MinecraftPayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#23272a" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#5865F2" }} />
      </div>
    }>
      <PayContent />
    </Suspense>
  );
}
