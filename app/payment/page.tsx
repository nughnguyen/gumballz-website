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

const BANK_ID = process.env.NEXT_PUBLIC_BANK_ID || "MB";
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO || "0000000000";
const BANK_NAME = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "NGUYEN VAN A";
const MOMO_PHONE = process.env.NEXT_PUBLIC_MOMO_PHONE || "0900000000";

function PaymentCard() {
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount") || "0";
  const content = searchParams.get("content") || "UNKNOWN";
  const method = searchParams.get("method") || "Banking";
  const userId = searchParams.get("userId");

  const [copied, setCopied] = useState("");
  const [status, setStatus] = useState("pending");

  const amountNum = parseInt(amount);
  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amountNum);

  const qrUrl =
    method === "Momo"
      ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=2|99|${MOMO_PHONE}|${BANK_NAME}|0|0|0|${amountNum}|${content}|transfer_myqr` // Momo QR hack or just static
      : `https://img.vietqr.io/image/${BANK_ID}-${BANK_ACCOUNT}-compact2.png?amount=${amount}&addInfo=${content}&accountName=${encodeURIComponent(
          BANK_NAME
        )}`;

  // For Momo, the QR format above is not guaranteed.
  // Safest for Momo is just displaying the phone number if no official API.
  // But let's assume we display a generic QR containing the content text for copy-paste?
  // Actually, for Momo, often people scan a static QR.

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(""), 2000);
  };

  // Simulate polling for status
  useEffect(() => {
    const interval = setInterval(async () => {
      // In a real app, call API: const res = await fetch(`/api/check-transaction?content=${content}`);
      // const data = await res.json();
      // if (data.success) setStatus("success");
      // For demo, we just wait.
    }, 5000);
    return () => clearInterval(interval);
  }, [content]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 text-white font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-violet-600 p-6 text-center">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            {method === "Momo" ? (
              <Smartphone className="w-6 h-6" />
            ) : (
              <CreditCard className="w-6 h-6" />
            )}
            Cổng Thanh Toán
          </h1>
          <p className="text-white/80 text-sm mt-1">
            Hoàn tất giao dịch để nhận Coinz
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Amount */}
          <div className="text-center">
            <span className="text-neutral-400 text-sm uppercase tracking-wider">
              Số tiền thanh toán
            </span>
            <div className="text-4xl font-bold text-green-400 mt-1">
              {formattedAmount}
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl mx-auto w-fit shadow-inner">
            {/* Use simple img for QR */}
            <img
              src={qrUrl}
              alt="Payment QR"
              className="w-48 h-48 object-contain"
              onError={(e) => {
                // Fallback if QR fails
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/200x200?text=QR+Error";
              }}
            />
          </div>

          {method === "Momo" && (
            <p className="text-xs text-center text-yellow-500">
              *Lưu ý: Đối với Momo, vui lòng nhập đúng Lời nhắn chuyển tiền.
            </p>
          )}

          {/* Details Info */}
          <div className="space-y-3 bg-neutral-800/50 p-4 rounded-xl">
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

          {/* Status */}
          <div className="flex items-center justify-center gap-2 text-neutral-400 text-sm">
            {status === "pending" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang chờ xác nhận giao dịch...
              </>
            ) : (
              <span className="text-green-500 font-bold flex items-center gap-1">
                <Check className="w-5 h-5" /> Giao dịch thành công!
              </span>
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
