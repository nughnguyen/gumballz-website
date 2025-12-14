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
} from "lucide-react";

const BANK_ID = process.env.NEXT_PUBLIC_BANK_ID || "OCB";
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO || "0388205003";
const BANK_NAME = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "NGUYEN QUOC HUNG";
const MOMO_PHONE = process.env.NEXT_PUBLIC_MOMO_PHONE || "0388205003";

function PaymentCard() {
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount") || "0";
  const content = searchParams.get("content") || "UNKNOWN";
  const method = searchParams.get("method") || "Banking";
  const expiryParam = searchParams.get("expiry");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userId = searchParams.get("userId");

  const [copied, setCopied] = useState("");
  const [status, setStatus] = useState("pending");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const amountNum = parseInt(amount);
  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amountNum);

  const qrUrl =
    method === "Momo"
      ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=2|99|${MOMO_PHONE}|${BANK_NAME}|0|0|0|${amountNum}|${content}|transfer_myqr`
      : `https://img.vietqr.io/image/${BANK_ID}-${BANK_ACCOUNT}-compact.png?amount=${amount}&addInfo=${content}&accountName=${encodeURIComponent(
          BANK_NAME
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

    const expiryTime = parseInt(expiryParam) * 1000; // Convert to ms

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
    if (!content || content === "UNKNOWN" || isExpired || status === "success")
      return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/check-transaction?content=${content}`);
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
  }, [content, isExpired, status]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 text-white font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden relative"
      >
        {/* Header */}
        <div
          className={`p-6 text-center bg-gradient-to-r ${
            method === "Momo"
              ? "from-pink-600 to-red-600"
              : method === "VNPAY"
              ? "from-blue-500 to-blue-700"
              : "from-blue-600 to-violet-600"
          }`}
        >
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            {methodIcon()}
            Cổng Thanh Toán {method === "VIETQR" ? "VietQR" : method}
          </h1>
          <p className="text-white/80 text-sm mt-1">
            Hoàn tất giao dịch để nhận Coinz
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Timer & Amount */}
          <div className="text-center space-y-2">
            <div className="flex justify-between items-center px-4">
              <span className="text-neutral-400 text-sm uppercase tracking-wider">
                Thời gian còn lại
              </span>
              {timeLeft !== null && (
                <span
                  className={`font-mono font-bold ${
                    timeLeft < 60
                      ? "text-red-500 animate-pulse"
                      : "text-yellow-400"
                  }`}
                >
                  {formatTime(timeLeft)}
                </span>
              )}
            </div>
            <div className="text-4xl font-bold text-green-400 mt-1">
              {formattedAmount}
            </div>
          </div>

          {/* QR Code or Expired State */}
          <div className="relative mx-auto w-fit">
            {status === "success" ? (
              <div className="w-48 h-48 bg-green-900/20 rounded-xl flex flex-col items-center justify-center border-2 border-green-500">
                <Check className="w-16 h-16 text-green-500 mb-2" />
              </div>
            ) : (
              <div
                className={`bg-white p-4 rounded-xl shadow-inner relative group ${
                  isExpired ? "border-4 border-red-500" : ""
                }`}
              >
                <img
                  src={qrUrl}
                  alt="Payment QR"
                  className={`w-48 h-48 object-contain ${
                    isExpired ? "opacity-80" : ""
                  }`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/200x200?text=QR+Error";
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-xl">
                  <span className="text-xs text-black font-medium bg-white/80 px-2 py-1 rounded">
                    Scan with App
                  </span>
                </div>
                {isExpired && (
                  <div className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                    HẾT HẠN
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Logic Messages */}
          {isExpired ? (
            <div className="bg-red-900/40 border border-red-500/50 p-3 rounded-lg text-center">
              <p className="text-red-200 text-sm font-bold">
                ⚠️ GIAO DỊCH ĐÃ HẾT HẠN
              </p>
              <p className="text-red-300 text-xs mt-1">
                Mã đã hết hạn. Bạn vẫn có thể quét, nhưng giao dịch sẽ{" "}
                <b>KHÔNG ĐƯỢC TÍNH</b> tự động và chúng tôi{" "}
                <b>KHÔNG CHỊU TRÁCH NHIỆM</b>.
              </p>
            </div>
          ) : (
            <>
              {method === "Momo" && (
                <p className="text-xs text-center text-yellow-500">
                  *Lưu ý: Đối với Momo, vui lòng nhập đúng Lời nhắn chuyển tiền.
                </p>
              )}
              {method === "VNPAY" && (
                <p className="text-xs text-center text-blue-400">
                  *Mở ứng dụng VNPAY hoặc App Ngân hàng để quét mã.
                </p>
              )}
            </>
          )}

          {/* Details Info - Hide if expired to prevent accidental transfer? Or keep for ref? Keeping for ref is risky. Better blur. */}
          <div
            className={`space-y-3 bg-neutral-800/50 p-4 rounded-xl transition-opacity ${
              isExpired
                ? "opacity-50 pointer-events-none select-none filter blur-sm"
                : ""
            }`}
          >
            {method === "Momo" ? (
              <DetailRow
                label="Số điện thoại"
                value={MOMO_PHONE}
                onCopy={() => handleCopy(MOMO_PHONE, "phone")}
                copied={copied === "phone"}
              />
            ) : (
              <>
                <DetailRow label="Ngân hàng" value={BANK_ID} />
                <DetailRow
                  label="Số tài khoản"
                  value={BANK_ACCOUNT}
                  onCopy={() => handleCopy(BANK_ACCOUNT, "acc")}
                  copied={copied === "acc"}
                />
              </>
            )}
            <DetailRow label="Chủ tài khoản" value={BANK_NAME} />
            <div className="border-t border-neutral-700 my-2"></div>
            <DetailRow
              label="Nội dung chuyển khoản"
              value={content}
              highlight
              onCopy={() => handleCopy(content, "content")}
              copied={copied === "content"}
            />
          </div>

          {/* Status Message */}
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            {status === "pending" && !isExpired && (
              <div className="flex items-center gap-2 text-neutral-400 text-sm animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang chờ thanh toán...
              </div>
            )}
            {status === "success" && (
              <div className="space-y-1">
                <span className="text-green-500 font-bold flex items-center justify-center gap-1 text-lg">
                  <ShieldCheck className="w-6 h-6" /> Giao dịch thành công!
                </span>
                <p className="text-white text-sm">
                  Bạn có thể quay về Discord để kiểm tra số dư.
                </p>
                <p className="text-neutral-500 text-xs mt-2">
                  Bot sẽ tự động cộng Coinz trong giây lát.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-900 p-4 text-center border-t border-neutral-800">
          <p className="text-neutral-500 text-xs">Mã đơn hàng: {content}</p>
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
}: {
  label: string;
  value: string;
  highlight?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex justify-between items-center group">
      <span className="text-neutral-400 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={`font-medium ${
            highlight ? "text-blue-400" : "text-white"
          }`}
        >
          {value}
        </span>
        {onCopy && (
          <button
            onClick={onCopy}
            className="text-neutral-500 hover:text-white transition-colors relative"
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
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <PaymentCard />
    </Suspense>
  );
}
