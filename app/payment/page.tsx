"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Loader2,
  Clock,
  ArrowLeft,
  Key,
  ExternalLink
} from "lucide-react";
import Link from 'next/link';

const BANK_1 = {
  id: process.env.NEXT_PUBLIC_BANK_ID || "OCB",
  account: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO || "0388205003",
  name: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "NGUYEN QUOC HUNG",
  icon: "🏦"
};

const BANK_2 = {
  id: process.env.NEXT_PUBLIC_BANK_ID_2,
  account: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO_2,
  name: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME_2,
  icon: "🏦"
};

const BANKS = [BANK_1];
if (BANK_2.id && BANK_2.account) {
  BANKS.push(BANK_2 as typeof BANK_1);
}

const MOMO_PHONE = process.env.NEXT_PUBLIC_MOMO_PHONE || "0388205003";

function PaymentCard() {
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount") || "0";
  const content = searchParams.get("content") || "UNKNOWN";
  const method = searchParams.get("method") || "Banking";
  const expiryParam = searchParams.get("expiry");
  const txId = searchParams.get("txId");

  const [copied, setCopied] = useState("");
  const [status, setStatus] = useState("pending");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [selectedBank, setSelectedBank] = useState(BANK_1);

  // Persistence check on mount
  useEffect(() => {
    async function checkInitialStatus() {
        if (!txId && !content) return;
        try {
            const queryParam = txId ? `id=${txId}` : `content=${content}`;
            const res = await fetch(`/api/check-transaction?${queryParam}`);
            const data = await res.json();
            if (data.success) {
                setStatus("success");
                if (data.key) setGeneratedKey(data.key);
            } else if (data.status === 'expired') {
                setIsExpired(true);
            }
        } catch (e) {
            console.error("Initial check error:", e);
        }
    }
    checkInitialStatus();
  }, [txId, content]);

  useEffect(() => {
    const providerParam = searchParams.get("provider");
    if (providerParam === "sepay" && BANKS.length > 1) {
        const sepayBank = BANKS.find(b => b.id === BANK_2.id && b.account === BANK_2.account);
        if (sepayBank) setSelectedBank(sepayBank);
    }
  }, [searchParams]);

  const amountNum = parseInt(amount);
  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amountNum);

  const qrUrl =
    method === "Momo"
      ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=2|99|${MOMO_PHONE}|${BANK_1.name}|0|0|0|${amountNum}|${content}|transfer_myqr`
      : `https://img.vietqr.io/image/mbbank-0388205003-qr_only.png?amount=${amount}&addInfo=${content}&accountName=NGUYEN%20QUOC%20HUNG`;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(""), 2000);
  };

  useEffect(() => {
    if (!expiryParam || status === "success") return;
    let expiryTime = parseInt(expiryParam);
    if (expiryTime < 10000000000) expiryTime *= 1000;

    const timer = setInterval(() => {
      const diff = expiryTime - Date.now();
      if (diff <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        clearInterval(timer);
      } else {
        setTimeLeft(Math.floor(diff / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiryParam, status]);

  useEffect(() => {
    if ((!txId && (!content || content === "UNKNOWN")) || isExpired || status === "success") return;
    const interval = setInterval(async () => {
      try {
        const queryParam = txId ? `id=${txId}` : `content=${content}`;
        const res = await fetch(`/api/check-transaction?${queryParam}`);
        const data = await res.json();
        if (data.success) {
          setStatus("success");
          if (data.key) setGeneratedKey(data.key);
          clearInterval(interval);
        }
      } catch (e) { console.error(e); }
    }, 3000);
    return () => clearInterval(interval);
  }, [content, txId, isExpired, status]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 font-sans text-slate-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
             <Link href="/" className="text-slate-500 hover:text-white transition-colors flex items-center gap-1 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Quay lại
             </Link>
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">GumballZ Pay</div>
             <div className="w-16"></div>
        </div>

        <div className="bg-blue-600 p-8 text-white text-center relative overflow-hidden">
             <div className="relative z-10 flex flex-col items-center">
                 <div className="mb-2 opacity-70 uppercase text-[10px] font-black tracking-[0.2em]">Số tiền</div>
                 <div className="text-4xl font-black tracking-tighter italic">{formattedAmount}</div>
                 
                 {status !== "success" && (
                    <div className="flex items-center gap-2 mt-5 bg-black/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                        <Clock className={`w-4 h-4 ${timeLeft && timeLeft < 60 ? "text-yellow-400 animate-pulse" : "text-blue-200"}`} />
                        <span className="text-xs font-bold uppercase tracking-tight">Hết hạn:</span>
                        {timeLeft !== null && (
                            <span className="font-mono font-black text-white ml-1">
                                {formatTime(timeLeft)}
                            </span>
                        )}
                    </div>
                 )}
             </div>
        </div>

        <div className="p-8 space-y-8">
          {/* QR Code Section */}
          <div className="flex flex-col items-center">
            {status === "success" ? (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/30">
                  <Check className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Thanh toán hoàn tất!</h2>
                    <p className="text-slate-400 text-sm mt-1">Hệ thống đã xác nhận giao dịch của bạn.</p>
                </div>

                {generatedKey && (
                    <div className="bg-blue-600/10 border border-blue-500/30 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest">
                            <Key className="w-4 h-4" /> VIP Key của bạn
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-grow bg-slate-950 p-4 rounded-xl font-mono text-xl font-black text-white border border-white/5 tracking-wider overflow-hidden">
                                {generatedKey}
                            </div>
                            <button 
                                onClick={() => handleCopy(generatedKey, "gen-key")}
                                className="p-4 bg-blue-600 rounded-xl hover:bg-blue-500 transition-all text-white"
                            >
                                {copied === "gen-key" ? <Check /> : <Copy />}
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-500 italic text-center uppercase tracking-widest">Hãy copy và dán vào Mod Menu để kích hoạt.</p>
                    </div>
                )}

                <Link href="/" className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-bold hover:bg-white/10 transition-all">
                    Về trang chủ <ExternalLink className="w-4 h-4" />
                </Link>
              </motion.div>
            ) : (
                <div className="relative group">
                     <div className={`p-4 border border-white/10 rounded-[2rem] ${isExpired ? "opacity-20 grayscale" : "bg-white shadow-2xl"}`}>
                        <img src={qrUrl} alt="QR" className="w-52 h-52 object-contain" />
                     </div>
                     {!isExpired && (
                         <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-xl">
                             QUÉT MÃ MB BANK
                         </div>
                     )}
                     {isExpired && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-red-600 text-white font-black px-6 py-2 rounded-xl shadow-2xl rotate-[-12deg] tracking-widest italic">HẾT HẠN</span>
                        </div>
                     )}
                </div>
            )}
          </div>

          {status !== "success" && (
            <div className={`space-y-6 ${isExpired ? "opacity-30 pointer-events-none" : ""}`}>
                <div className="bg-slate-800/50 rounded-3xl p-6 border border-white/5 space-y-4">
                    <DetailRow label="Ngân hàng" value={selectedBank.id} />
                    <DetailRow label="Chủ tài khoản" value={selectedBank.name} truncate />
                    <DetailRow
                        label="Số tài khoản"
                        value={selectedBank.account}
                        onCopy={() => handleCopy(selectedBank.account, "acc")}
                        copied={copied === "acc"}
                        isMono
                    />
                    <div className="border-t border-dashed border-white/10 pt-4">
                        <DetailRow
                            label="Nội dung"
                            value={content}
                            highlight
                            onCopy={() => handleCopy(content, "content")}
                            copied={copied === "content"}
                            isMono
                            helpText="Bắt buộc nhập chính xác"
                        />
                    </div>
                </div>

                <div className="text-center animate-pulse flex items-center justify-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang chờ chuyển khoản...
                </div>
            </div>
          )}
        </div>

        <div className="bg-slate-800/30 p-4 text-center border-t border-white/5 text-[10px] font-mono text-slate-600">
          ID: {content} | GumballZ System
        </div>
      </motion.div>
    </div>
  );
}

function DetailRow({ label, value, highlight = false, onCopy, copied, isMono = false, truncate = false, helpText }: any) {
  return (
    <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
        <span className="text-slate-500 text-xs font-bold uppercase overflow-hidden whitespace-nowrap">{label}</span>
        <div className="flex items-center gap-2 max-w-[70%] text-right overflow-hidden">
            <span className={`font-bold ${highlight ? "text-blue-400" : "text-white"} ${isMono ? "font-mono" : ""} ${truncate ? "truncate" : ""}`}>
                {value}
            </span>
            {onCopy && (
                <button onClick={onCopy} className="text-slate-500 hover:text-white transition-colors">
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
            )}
        </div>
        </div>
        {helpText && <p className="text-[9px] text-red-400/80 text-right italic uppercase font-bold">{helpText}</p>}
    </div>
  );
}

export default function PaymentPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Đang tải...</div>}><PaymentCard /></Suspense>;
}
