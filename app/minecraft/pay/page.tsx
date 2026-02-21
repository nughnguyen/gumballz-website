"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2, Copy, Check, Clock, Loader2, Download,
  AlertCircle, ArrowLeft, Coins
} from "lucide-react";
import Link from "next/link";

// /minecraft/pay?orderId=xxx
// OR /minecraft/pay?code=MCxxx&amount=20000&pkg=money_20k (from plugin)
function PayContent() {
  const sp = useSearchParams();
  const orderId = sp.get("orderId");   // From website
  // Plugin sends these params for old flow - redirect to same page but show QR
  const pluginCode = sp.get("code");
  const pluginAmount = sp.get("amount");

  const [order, setOrder] = useState<any>(null);
  const [claimCode, setClaimCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [pollStatus, setPollStatus] = useState<"waiting" | "success" | "expired">("waiting");
  const [copied, setCopied] = useState("");
  const [loadErr, setLoadErr] = useState("");

  // Fetch order info if we have orderId
  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/minecraft/claim-status?orderId=${orderId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.status === "paid") {
          setClaimCode(d.claimCode);
          setPollStatus("success");
        }
        // Order meta not exposed here directly, need to get bank info another way
        // For now we use NEXT_PUBLIC env vars
      })
      .catch(() => setLoadErr("Không tải được đơn hàng"));
  }, [orderId]);

  // Countdown + poll (from website flow with orderId)
  useEffect(() => {
    if (!orderId || pollStatus !== "waiting") return;
    const expiry = Date.now() + 10 * 60 * 1000;
    const tick = setInterval(() => {
      const diff = expiry - Date.now();
      if (diff <= 0) { setPollStatus("expired"); setTimeLeft(0); clearInterval(tick); }
      else setTimeLeft(Math.floor(diff / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [orderId, pollStatus]);

  useEffect(() => {
    if (!orderId || pollStatus !== "waiting") return;
    const iv = setInterval(async () => {
      try {
        const r = await fetch(`/api/minecraft/claim-status?orderId=${orderId}`);
        const d = await r.json();
        if (d.success && d.status === "paid") {
          setClaimCode(d.claimCode);
          setPollStatus("success");
          clearInterval(iv);
        }
      } catch { /* ignore */ }
    }, 4000);
    return () => clearInterval(iv);
  }, [orderId, pollStatus]);

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(""), 2000);
  };

  // Plugin flow: show static QR from URL params
  if (pluginCode && pluginAmount) {
    const bankId = process.env.NEXT_PUBLIC_BANK_ID || "OCB";
    const accountNo = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO || "";
    const accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "";
    const qrUrl = `https://img.vietqr.io/image/${bankId.toLowerCase()}-${accountNo}-qr_only.png?amount=${pluginAmount}&addInfo=${pluginCode}&accountName=${encodeURIComponent(accountName)}`;
    const amtNum = parseInt(pluginAmount);

    return (
      <div className="min-h-screen bg-[#FFF9F5] pt-28 pb-20 px-4">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="clay-card p-6 bg-gradient-to-br from-cyan-500 to-cyan-600">
            <div className="text-cyan-100 text-xs font-black uppercase tracking-widest mb-1">Số tiền</div>
            <div className="text-4xl font-black text-white">{amtNum.toLocaleString("vi-VN")}đ</div>
          </div>
          <div className="clay-card p-6 space-y-4">
            <div className="clay-card p-3 bg-white">
              <img src={qrUrl} alt="QR" className="w-full h-auto mx-auto max-w-[250px]" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400 font-bold">Ngân hàng</span><span className="font-bold">{bankId}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 font-bold">Số tài khoản</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{accountNo}</span>
                  <button onClick={() => handleCopy(accountNo, "acc")} className="p-1 hover:bg-slate-100 rounded">
                    {copied === "acc" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-2">
                <span className="text-slate-400 font-bold">Nội dung CK</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-cyan-600">{pluginCode}</span>
                  <button onClick={() => handleCopy(pluginCode, "code")} className="p-1 hover:bg-slate-100 rounded">
                    {copied === "code" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> Nhập ĐÚNG nội dung để hệ thống tự nhận!
            </div>
            <p className="text-xs text-slate-400 text-center">Plugin sẽ tự xác nhận khi thanh toán thành công.</p>
          </div>
          <Link href="/minecraft/store" className="clay-button flex items-center justify-center gap-2">
            <Coins className="w-4 h-4" /> Mua thêm gói khác
          </Link>
        </div>
      </div>
    );
  }

  // No orderId and no plugin params — redirect to store
  if (!orderId && !pluginCode) {
    return (
      <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center">
        <div className="clay-card p-10 text-center max-w-sm">
          <h2 className="text-2xl font-black text-slate-900 mb-4">Trang không hợp lệ</h2>
          <p className="text-slate-500 mb-6">Đến cửa hàng Minecraft để tạo đơn hàng mới.</p>
          <Link href="/minecraft/store" className="clay-button flex items-center justify-center gap-2">
            <Coins className="w-4 h-4" /> Đến cửa hàng
          </Link>
        </div>
      </div>
    );
  }

  // Website flow with orderId - show waiting / success
  return (
    <div className="min-h-screen bg-[#FFF9F5] pt-28 pb-20 px-4">
      <div className="max-w-lg mx-auto">
        {pollStatus === "success" && claimCode ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="clay-card p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 border-[4px] border-slate-900 rounded-full flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#1E293B]">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900">Thanh toán thành công!</h2>
            <div className="clay-card p-6 bg-cyan-50 space-y-3">
              <p className="font-black text-slate-800">Mã nhận xu của bạn:</p>
              <div className="bg-slate-900 p-4 rounded-xl font-mono text-2xl font-black text-cyan-400 tracking-widest text-center relative">
                {claimCode}
                <button onClick={() => handleCopy(claimCode, "c")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-700 rounded-lg">
                  {copied === "c" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
                </button>
              </div>
              <div className="bg-slate-900 rounded-xl p-3">
                <p className="text-cyan-300 font-mono text-sm text-center">
                  /napthe redeem <span className="text-yellow-300 font-black">{claimCode}</span>
                </p>
              </div>
            </div>
            <Link href="/minecraft/store" className="clay-button flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Nạp thêm
            </Link>
          </motion.div>
        ) : (
          <div className="clay-card p-10 text-center space-y-6">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto" />
            <h2 className="text-xl font-black text-slate-900">Đang chờ thanh toán...</h2>
            {timeLeft !== null && (
              <div className="flex items-center justify-center gap-2 text-slate-500">
                <Clock className="w-4 h-4" />
                <span className="font-mono font-black text-lg">{fmtTime(timeLeft)}</span>
              </div>
            )}
            {pollStatus === "expired" && (
              <div className="text-red-600 font-black">Đơn hàng đã hết hạn. Vui lòng tạo lại.</div>
            )}
            <Link href="/minecraft/store" className="clay-button flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Về cửa hàng
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MinecraftPayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    }>
      <PayContent />
    </Suspense>
  );
}
