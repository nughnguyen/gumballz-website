"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  ShieldCheck,
  Loader2,
  Clock,
  Key,
  ExternalLink,
  CreditCard,
  AlertCircle,
  Download
} from "lucide-react";
import Link from 'next/link';
import { supabase } from "@/app/utils/supabaseClient";

const BANK_1 = {
  id: "",
  account: "",
  name: "",
  icon: "🏦"
};

const BANK_2 = {
  id: "",
  account: "",
  name: "",
  icon: "🏦"
};

const BANKS = [BANK_1];
if (BANK_2.id && BANK_2.account) {
  BANKS.push(BANK_2 as typeof BANK_1);
}

const MOMO_PHONE = "";

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
  const [selectedBank, setSelectedBank] = useState({ ...BANK_1, note: "", automatic: true });
  const [banks, setBanks] = useState<Array<typeof BANK_1 & { note?: string; automatic?: boolean }>>(BANKS);
  const [momoPhone, setMomoPhone] = useState(MOMO_PHONE);
  const [manualReviewRequested, setManualReviewRequested] = useState(false);
  const [manualReviewBusy, setManualReviewBusy] = useState(false);
  const [manualReviewMessage, setManualReviewMessage] = useState("");
  const [payosCheckoutUrl, setPayosCheckoutUrl] = useState("");
  const [payosLoading, setPayosLoading] = useState(false);
  const [payosError, setPayosError] = useState("");

  useEffect(() => {
    if (!txId) return;
    fetch(`/api/payment-details?id=${encodeURIComponent(txId)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        const available = data.banks.map((bank: { id: string; account: string; name: string; note?: string; automatic?: boolean }) => ({ ...bank, icon: "🏦" }));
        setBanks(available);
        if (available[0]) setSelectedBank({ ...available[0], note: available[0].note || "", automatic: available[0].automatic !== false });
        setMomoPhone(data.momoPhone || "");
      }).catch(() => undefined);
  }, [txId]);

  useEffect(() => {
    if (!txId || !selectedBank.account) return;
    void fetch("/api/payment-details", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: txId, content, bankId: selectedBank.id, account: selectedBank.account, name: selectedBank.name, note: selectedBank.note || "", automatic: selectedBank.automatic !== false }) });
  }, [txId, content, selectedBank]);

  useEffect(() => {
    if (!txId || method !== "Banking") return;
    let active = true;
    setPayosLoading(true);
    fetch("/api/payment/create-payos-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId: txId, content }),
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Chưa tạo được thanh toán payOS.");
        if (active && data.payable && typeof data.checkoutUrl === "string") setPayosCheckoutUrl(data.checkoutUrl);
      })
      .catch((error: unknown) => {
        if (active) setPayosError(error instanceof Error ? error.message : "payOS hiện chưa sẵn sàng.");
      })
      .finally(() => { if (active) setPayosLoading(false); });
    return () => { active = false; };
  }, [txId, content, method]);

  // Persistence check on mount
  useEffect(() => {
    async function checkInitialStatus() {
        if (!txId && !content) return;
        try {
            const queryParam = txId ? `id=${txId}` : `content=${content}`;
            const { data: sessionData } = await supabase.auth.getSession();
            const headers = sessionData.session ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {};
            const res = await fetch(`/api/check-transaction?${queryParam}`, { headers, cache: "no-store" });
            const data = await res.json();
            if (data.success) {
                setStatus("success");
                if (data.key) setGeneratedKey(data.key);
            } else if (data.status === 'expired') {
                setIsExpired(true);
            }
            if (data.manualReviewRequested) setManualReviewRequested(true);
        } catch (e) {
            console.error("Initial check error:", e);
        }
    }
    checkInitialStatus();
  }, [txId, content]);

  useEffect(() => {
    const providerParam = searchParams.get("provider");
    if (providerParam === "sepay" && banks.length > 1) {
        setSelectedBank({ ...banks[1], note: banks[1].note || "", automatic: banks[1].automatic !== false });
    }
  }, [searchParams, banks]);

  const amountNum = parseInt(amount);
  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amountNum);

  const qrUrl =
    method === "Momo"
      ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=2|99|${momoPhone}|${selectedBank.name}|0|0|0|${amountNum}|${content}|transfer_myqr`
      : `https://img.vietqr.io/image/${selectedBank.id.toLowerCase()}-${selectedBank.account}-qr_only.png?amount=${amount}&addInfo=${content}&accountName=${encodeURIComponent(selectedBank.name)}`;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR-${content}-${amount}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
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
        const { data: sessionData } = await supabase.auth.getSession();
        const headers = sessionData.session ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {};
        const res = await fetch(`/api/check-transaction?${queryParam}`, { headers, cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setStatus("success");
          if (data.key) setGeneratedKey(data.key);
          clearInterval(interval);
        } else if (data.manualReviewRequested) {
          setManualReviewRequested(true);
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

  async function requestManualReview() {
    if (!txId) return;
    setManualReviewBusy(true);
    setManualReviewMessage("");
    try {
      const response = await fetch("/api/payment/manual-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: txId, content }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Không gửi được yêu cầu duyệt.");
      setManualReviewRequested(true);
      setManualReviewMessage("Đã gửi yêu cầu. Admin sẽ kiểm tra sao kê và cập nhật đơn trong tài khoản của bạn.");
    } catch (error) {
      setManualReviewMessage(error instanceof Error ? error.message : "Không gửi được yêu cầu. Vui lòng thử lại.");
    } finally {
      setManualReviewBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF9F5] pt-28 pb-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Content Grid - 2 Columns: QR + Payment Info */}
          <div className="grid lg:grid-cols-2 gap-8 items-start max-w-[732px] mx-auto">
            {/* Left Column: QR + Download Button */}
            <div className="space-y-6">
              {/* QR Code Card */}
              <div className="clay-card p-8">
                {status === "success" ? (
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-6 text-center"
                  >
                    <div className="w-20 h-20 bg-green-100 border-[3px] border-slate-900 rounded-full flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_#1E293B]">
                      <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 mb-2">Thanh toán thành công!</h2>
                      <p className="text-slate-600 font-medium">Hệ thống đã xác nhận giao dịch của bạn</p>
                    </div>

                    {generatedKey && (
                      <div className="clay-card p-6 bg-gradient-to-br from-purple-50 to-white space-y-4">
                        <div className="flex items-center gap-2 text-purple-600 font-bold">
                          <Key className="w-5 h-5" /> VIP Key của bạn
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-grow bg-slate-100 border-[3px] border-slate-900 p-4 rounded-xl font-mono text-lg font-black text-slate-900 shadow-[2px_2px_0px_0px_#1E293B]">
                            {generatedKey}
                          </div>
                          <button 
                            onClick={() => handleCopy(generatedKey, "gen-key")}
                            className="p-4 bg-purple-500 border-[3px] border-slate-900 rounded-xl text-white shadow-[3px_3px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px transition-all"
                          >
                            {copied === "gen-key" ? <Check /> : <Copy />}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 font-bold">Copy và dán vào Mod Menu để kích hoạt</p>
                      </div>
                    )}

                    <Link href="/" className="clay-button w-full flex items-center justify-center gap-2">
                      Về trang chủ <ExternalLink className="w-5 h-5" />
                    </Link>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-black text-slate-900 text-lg text-center flex items-center justify-center gap-2">
                      <CreditCard className="w-5 h-5 text-cyan-500" />
                      Mã QR Thanh Toán
                    </h3>
                    <motion.div 
                      className="relative"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div 
                        className={`p-4 bg-white border-[3px] border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer ${isExpired ? "opacity-20 grayscale" : ""}`}
                      >
                        <img src={qrUrl} alt="QR" className="w-full h-auto object-contain" />
                      </div>
                      {isExpired && (
                        <motion.div 
                          className="absolute inset-0 flex items-center justify-center"
                          initial={{ scale: 0, rotate: 0 }}
                          animate={{ scale: 1, rotate: -12 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          <span className="bg-red-500 text-white font-black px-6 py-3 rounded-xl border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_#1E293B] tracking-widest">HẾT HẠN</span>
                        </motion.div>
                      )}
                    </motion.div>
                    
                    {/* Download QR Button */}
                    {!isExpired && (
                      <motion.button
                        onClick={handleDownloadQR}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3 bg-slate-100 border-[3px] border-slate-900 rounded-xl font-bold text-slate-900 shadow-[3px_3px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Tải mã QR
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Payment Details */}
            {status !== "success" && (
              <div className={`clay-card p-5 space-y-6 ${isExpired ? "opacity-30" : ""}`}>
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-500" />
                  Thông Tin Chuyển Khoản
                </h3>

                {payosCheckoutUrl && selectedBank.automatic !== false && <div className="border-[3px] border-slate-900 bg-[#7FE7D6] p-4 shadow-[4px_4px_0_#1e293b]"><p className="text-sm font-black">Thanh toán tự động qua payOS</p><p className="mt-1 text-xs font-semibold">PayOS hỗ trợ chuyển khoản Napas 24/7 và tự xác nhận giao dịch.</p><button type="button" onClick={() => location.assign(payosCheckoutUrl)} className="clay-button mt-3 w-full">Mở trang thanh toán payOS <ExternalLink size={16}/></button></div>}
                {payosLoading && <p className="text-xs font-semibold text-slate-500">Đang kết nối payOS…</p>}
                {payosError && <p role="status" className="border-2 border-[#0B3D91] bg-[#E8F6FF] p-3 text-xs font-bold">{payosError} Bạn vẫn có thể chuyển khoản theo thông tin bên dưới.</p>}

                <div className="space-y-4">
                  {banks.length > 1 && <select aria-label="Chọn tài khoản nhận tiền" value={selectedBank.account} onChange={(event) => { const bank = banks.find((item) => item.account === event.target.value); if (bank) setSelectedBank({ ...bank, note: bank.note || "", automatic: bank.automatic !== false }); }} className="w-full border-[3px] border-slate-900 bg-white p-3 font-bold">{banks.map((bank) => <option key={`${bank.id}-${bank.account}`} value={bank.account}>{bank.id} · {bank.account} · {bank.name}</option>)}</select>}{selectedBank.note && <p className="border-2 border-cyan-300 bg-cyan-50 p-3 text-sm font-semibold">{selectedBank.note}</p>}<p className="text-xs font-black uppercase">{selectedBank.automatic === false ? "Tài khoản này cần admin đối chiếu thủ công" : "Giao dịch tự động"}</p><DetailRow label="Ngân hàng" value={selectedBank.id} />
                  <DetailRow label="Chủ tài khoản" value={selectedBank.name} />
                  <DetailRow
                    label="Số tài khoản"
                    value={selectedBank.account}
                    onCopy={() => handleCopy(selectedBank.account, "acc")}
                    copied={copied === "acc"}
                    isMono
                  />
                  <div className="border-t-2 border-dashed border-slate-200 pt-4">
                    <DetailRow
                      label="Nội dung CK"
                      value={content}
                      highlight
                      onCopy={() => handleCopy(content, "content")}
                      copied={copied === "content"}
                      isMono
                    />
                    <div className="mt-2 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                      <p className="text-xs text-red-700 font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Nhập chính xác nội dung để hệ thống đối chiếu và xử lý đúng đơn hàng sau khi xác nhận thanh toán.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <div className="inline-flex items-center gap-2 text-slate-700 font-bold">
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                    <span className="text-sm">Đang chờ thanh toán...</span>
                  </div>
                </div>

                {txId && method === "Banking" && selectedBank.automatic === false && !status.startsWith("success") && <div className="border-t-2 border-dashed border-slate-300 pt-4">
                  {manualReviewRequested ? <div role="status" aria-live="polite" className="border-[3px] border-slate-900 bg-[#E8F6FF] p-4 shadow-[3px_3px_0_#1e293b]"><p className="font-black">Đang chờ Admin duyệt</p><p className="mt-1 text-sm font-semibold">Yêu cầu thanh toán của bạn đã được gửi. Đơn sẽ được xử lý sau khi Admin đối chiếu sao kê.</p></div> : <><p className="text-sm font-semibold leading-6 text-slate-600">Chuyển khoản từ ngân hàng chưa hỗ trợ tự động? Sau khi chuyển tiền, hãy gửi yêu cầu để Admin kiểm tra thủ công.</p><button type="button" disabled={manualReviewBusy} onClick={() => void requestManualReview()} className="clay-button mt-3 w-full disabled:opacity-60">{manualReviewBusy ? "Đang gửi yêu cầu…" : "Tôi đã chuyển khoản — yêu cầu Admin duyệt"}</button></>}
                  {manualReviewMessage && <p role="status" className="mt-2 text-sm font-bold">{manualReviewMessage}</p>}
                  {manualReviewRequested && <Link href="/account" className="mt-3 inline-flex items-center gap-1 text-sm font-black underline">Theo dõi trong tài khoản <ExternalLink size={14}/></Link>}
                </div>}
              </div>
            )}
          </div>

          {/* Amount Card - Full Width Horizontal Rectangle */}
          {status !== "success" && (
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
          )}
        </motion.div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <div className="clay-card inline-block px-6 py-3">
            <p className="text-slate-500 text-xs font-mono">
              Transaction ID: <span className="text-slate-900 font-bold">{content}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight = false, onCopy, copied, isMono = false }: {
  label: string;
  value: string;
  highlight?: boolean;
  onCopy?: () => void;
  copied?: boolean;
  isMono?: boolean;
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
            <button 
              onClick={onCopy} 
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return <Suspense fallback={
    <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center">
      <div className="clay-card px-8 py-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
          <span className="font-bold text-slate-900">Đang tải...</span>
        </div>
      </div>
    </div>
  }><PaymentCard /></Suspense>;
}
