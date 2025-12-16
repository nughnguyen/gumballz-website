"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Loader2,
  Clock,
  ArrowLeft
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

// Available banks pool
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userId = searchParams.get("userId");

  const [copied, setCopied] = useState("");
  const [status, setStatus] = useState("pending");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  
  // Randomly select a bank on mount, or use forced provider
  const [selectedBank, setSelectedBank] = useState(BANK_1);

  useEffect(() => {
    const providerParam = searchParams.get("provider"); // 'sepay' or 'casso'
    
    if (providerParam === "sepay" && BANKS.length > 1) {
        // Force try to find the second bank (usually SePay)
        // Checks if BANK_2 is in the list
        const sepayBank = BANKS.find(b => b.id === BANK_2.id && b.account === BANK_2.account);
        if (sepayBank) {
            setSelectedBank(sepayBank);
            return;
        }
    }

    if (BANKS.length > 1) {
      // If no valid force param, use random
      const randomBank = BANKS[Math.floor(Math.random() * BANKS.length)];
      setSelectedBank(randomBank);
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
      : `https://img.vietqr.io/image/${selectedBank.id}-${selectedBank.account}-compact.png?amount=${amount}&addInfo=${content}&accountName=${encodeURIComponent(
          selectedBank.name
        )}`;

  const methodIcon = () => {
    if (method === "Momo") return <Smartphone className="w-6 h-6" />;
    if (method === "VNPAY") return <CreditCard className="w-6 h-6" />;
    return <CreditCard className="w-6 h-6" />;
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(""), 2000);
  };

  // Countdown Logic
  useEffect(() => {
    if (!expiryParam) return;

    let expiryTime = parseInt(expiryParam);
    if (expiryTime < 10000000000) {
        expiryTime = expiryTime * 1000;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        clearInterval(timer);
      } else {
        setTimeLeft(Math.floor(diff / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryParam]);

  // Poll for status
  useEffect(() => {
    if (!txId && (!content || content === "UNKNOWN")) return;
    if (isExpired || status === "success") return;

    const interval = setInterval(async () => {
      try {
        const queryParam = txId ? `id=${txId}` : `content=${content}`;
        const res = await fetch(`/api/check-transaction?${queryParam}`);
        const data = await res.json();
        if (data.success) {
          setStatus("success");
          clearInterval(interval);
        }
      } catch (e) {
        console.error(e);
      }
    }, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, [content, txId, isExpired, status]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
             <Link href="/" className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Quay lại
             </Link>
             <div className="text-sm font-bold text-slate-700 uppercase tracking-wide">Thanh toán đơn hàng</div>
             <div className="w-16"></div> {/* Spacer */}
        </div>

        <div className="bg-blue-600 p-6 text-white text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             <div className="relative z-10 flex flex-col items-center">
                 <div className="mb-2 opacity-80 uppercase text-xs font-semibold tracking-wider">Số tiền thanh toán</div>
                 <div className="text-4xl font-extrabold tracking-tight">{formattedAmount}</div>
                 
                 <div className="flex items-center gap-2 mt-4 bg-blue-500/30 px-3 py-1.5 rounded-full backdrop-blur-sm border border-blue-400/30">
                    <Clock className="w-4 h-4 text-blue-200" />
                    <span className="text-sm font-medium text-blue-100">Hết hạn trong:</span>
                    {timeLeft !== null && (
                        <span className={`font-mono font-bold ${timeLeft < 60 ? "text-yellow-300 animate-pulse" : "text-white"}`}>
                            {formatTime(timeLeft)}
                        </span>
                    )}
                 </div>
             </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 bg-white">
          
          {/* QR Code Section */}
          <div className="flex flex-col items-center">
            {status === "success" ? (
              <div className="w-48 h-48 bg-green-50 rounded-2xl flex flex-col items-center justify-center border-2 border-green-500 animate-[bounce_1s_ease-out]">
                <Check className="w-16 h-16 text-green-500 mb-2" />
                <span className="text-green-700 font-bold text-sm">Thành công!</span>
              </div>
            ) : (
                <div className="relative">
                     <div className={`p-3 border-2 rounded-2xl ${isExpired ? "border-red-200 bg-red-50" : "border-blue-100 bg-white shadow-sm"}`}>
                        <img
                        src={qrUrl}
                        alt="Payment QR"
                        className={`w-48 h-48 object-contain rounded-lg ${
                            isExpired ? "opacity-30 grayscale" : ""
                        }`}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src =
                            "https://placehold.co/200x200?text=QR+Error";
                        }}
                        />
                     </div>
                     {!isExpired && (
                         <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 whitespace-nowrap">
                             QUÉT MÃ ĐỂ THANH TOÁN
                         </div>
                     )}
                     {isExpired && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg shadow-lg rotate-[-10deg]">HẾT HẠN</span>
                        </div>
                     )}
                </div>
            )}
          </div>

          {/* Info Box */}
          <div className={`space-y-4 ${isExpired ? "opacity-50 pointer-events-none filter blur-[1px]" : ""}`}>
               <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                   {method === "Momo" ? (
                        <DetailRow
                            label="Số điện thoại"
                            value={MOMO_PHONE}
                            onCopy={() => handleCopy(MOMO_PHONE, "phone")}
                            copied={copied === "phone"}
                        />
                    ) : (
                    <>
                        <DetailRow 
                            label="Ngân hàng" 
                            value={`${selectedBank.id} - ${selectedBank.name}`}
                            truncate 
                        />
                        <DetailRow
                            label="Số tài khoản"
                            value={selectedBank.account}
                            onCopy={() => handleCopy(selectedBank.account, "acc")}
                            copied={copied === "acc"}
                            isMono
                        />
                    </>
                    )}
                    <div className="w-full h-px bg-slate-200 border-t border-dashed"></div>
                    <DetailRow
                        label="Nội dung CK"
                        value={content}
                        highlight
                        onCopy={() => handleCopy(content, "content")}
                        copied={copied === "content"}
                        isMono
                        helpText="Bắt buộc nhập chính xác"
                    />
               </div>

               {/* Status Text inside card */}
               <div className="text-center">
                   {status === "pending" && !isExpired && (
                       <p className="text-slate-500 text-xs flex items-center justify-center gap-1.5 animate-pulse">
                           <Loader2 className="w-3 h-3 animate-spin" /> Hệ thống đang kiểm tra giao dịch...
                       </p>
                   )}
                   {isExpired && (
                        <p className="text-red-500 text-sm font-bold">Lệnh nạp đã hết hạn. Vui lòng tạo lại.</p>
                   )}
                   {status === "success" && (
                       <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                           <p className="text-green-700 font-bold text-sm flex items-center justify-center gap-1">
                                <ShieldCheck className="w-4 h-4" /> Giao dịch hoàn tất
                           </p>
                           <p className="text-green-600 text-xs mt-1">Coinz đã được cộng vào tài khoản của bạn.</p>
                       </div>
                   )}
               </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
          <p className="text-slate-400 text-[10px] font-mono">Transaction ID: {content}</p>
        </div>
      </motion.div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
  onCopy,
  copied,
  isMono = false,
  truncate = false,
  helpText
}: {
  label: string;
  value: string;
  highlight?: boolean;
  onCopy?: () => void;
  copied?: boolean;
  isMono?: boolean;
  truncate?: boolean;
  helpText?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center group">
        <span className="text-slate-500 text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2 max-w-[70%] justify-end">
            <span
            className={`font-semibold text-right ${
                highlight ? "text-blue-600" : "text-slate-800"
            } ${isMono ? "font-mono" : ""} ${truncate ? "truncate" : ""}`}
            title={value}
            >
            {value}
            </span>
            {onCopy && (
            <button
                onClick={onCopy}
                className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                title="Sao chép"
            >
                {copied ? (
                <Check className="w-4 h-4 text-green-500" />
                ) : (
                <Copy className="w-4 h-4" />
                )}
            </button>
            )}
        </div>
        </div>
        {helpText && (
            <p className="text-[10px] text-red-500 text-right italic pt-0 mt-[-2px]">{helpText}</p>
        )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <PaymentCard />
    </Suspense>
  );
}
